package com.quanlybanhang.service;

import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptCreateRequest;
import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptLineRequest;
import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptLineResponse;
import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.GoodsReceipt;
import com.quanlybanhang.model.GoodsReceiptItem;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.repository.GoodsReceiptRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.SupplierRepository;
import com.quanlybanhang.repository.spec.GoodsReceiptSpecifications;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GoodsReceiptService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final GoodsReceiptRepository goodsReceiptRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final StoreRepository storeRepository;
  private final SupplierRepository supplierRepository;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<GoodsReceiptResponse> list(
      Pageable pageable,
      Long storeId,
      String status,
      LocalDateTime fromReceiptDate,
      LocalDateTime toReceiptDate) {
    Specification<GoodsReceipt> spec =
        GoodsReceiptSpecifications.filter(storeId, status, fromReceiptDate, toReceiptDate);
    return goodsReceiptRepository.findAll(spec, pageable).map(this::toResponseWithoutLines);
  }

  public GoodsReceiptResponse get(Long id) {
    GoodsReceipt r =
        goodsReceiptRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập không tồn tại: " + id));
    return toResponse(r);
  }

  private GoodsReceiptResponse toResponseWithoutLines(GoodsReceipt r) {
    return new GoodsReceiptResponse(
        r.getId(),
        r.getReceiptCode(),
        r.getStoreId(),
        r.getSupplierId(),
        r.getReceiptDate(),
        r.getStatus(),
        r.getSubtotal(),
        r.getDiscountAmount(),
        r.getTotalAmount(),
        r.getNote(),
        r.getCreatedBy(),
        r.getApprovedBy(),
        r.getCreatedAt(),
        r.getUpdatedAt(),
        List.of());
  }

  @Transactional
  public GoodsReceiptResponse createDraft(GoodsReceiptCreateRequest req, long userId) {
    if (!storeRepository.existsById(req.storeId())) {
      throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
    }
    if (req.supplierId() != null && !supplierRepository.existsById(req.supplierId())) {
      throw new BusinessException("Nhà cung cấp không tồn tại: " + req.supplierId());
    }
    for (GoodsReceiptLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
    }
    LocalDateTime t = now();
    GoodsReceipt gr = new GoodsReceipt();
    gr.setReceiptCode(nextReceiptCode());
    gr.setStoreId(req.storeId());
    gr.setSupplierId(req.supplierId());
    gr.setReceiptDate(req.receiptDate());
    gr.setStatus(DomainConstants.RECEIPT_DRAFT);
    gr.setDiscountAmount(req.headerDiscountAmount());
    gr.setNote(req.note());
    gr.setCreatedBy(userId);
    gr.setCreatedAt(t);
    gr.setUpdatedAt(t);

    BigDecimal subtotal = BigDecimal.ZERO;
    for (GoodsReceiptLineRequest line : req.lines()) {
      BigDecimal lineTotal = lineTotal(line);
      subtotal = subtotal.add(lineTotal);
      GoodsReceiptItem item = new GoodsReceiptItem();
      item.setVariantId(line.variantId());
      item.setQuantity(line.quantity());
      item.setUnitCost(line.unitCost());
      item.setDiscountAmount(line.discountAmount());
      item.setLineTotal(lineTotal);
      gr.addLine(item);
    }
    gr.setSubtotal(subtotal);
    gr.setTotalAmount(subtotal.subtract(req.headerDiscountAmount()).max(BigDecimal.ZERO));

    goodsReceiptRepository.save(gr);
    return get(gr.getId());
  }

  @Transactional
  public GoodsReceiptResponse confirm(Long id, long userId) {
    GoodsReceipt gr =
        goodsReceiptRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập không tồn tại: " + id));
    if (!DomainConstants.RECEIPT_DRAFT.equals(gr.getStatus())) {
      throw new BusinessException("Chỉ phiếu trạng thái draft mới xác nhận nhập kho.");
    }
    if (gr.getItems().isEmpty()) {
      throw new BusinessException("Phiếu không có dòng chi tiết.");
    }
    LocalDateTime t = now();
    for (GoodsReceiptItem line : gr.getItems()) {
      applyInventoryInbound(gr.getStoreId(), gr.getId(), line, userId, t);
    }
    gr.setStatus(DomainConstants.RECEIPT_COMPLETED);
    gr.setApprovedBy(userId);
    gr.setUpdatedAt(t);
    goodsReceiptRepository.save(gr);
    return get(id);
  }

  private void applyInventoryInbound(
      Long storeId, Long receiptId, GoodsReceiptItem line, long userId, LocalDateTime t) {
    Long variantId = line.getVariantId();
    BigDecimal qty = line.getQuantity();
    Inventory inv =
        inventoryRepository
            .findByStoreIdAndVariantId(storeId, variantId)
            .orElseGet(
                () -> {
                  Inventory n = new Inventory();
                  n.setStoreId(storeId);
                  n.setVariantId(variantId);
                  n.setQuantityOnHand(BigDecimal.ZERO);
                  n.setReservedQty(BigDecimal.ZERO);
                  n.setUpdatedAt(t);
                  return n;
                });
    BigDecimal before = inv.getQuantityOnHand();
    BigDecimal after = before.add(qty);
    inv.setQuantityOnHand(after);
    inv.setUpdatedAt(t);
    inventoryRepository.save(inv);

    InventoryTransaction tx = new InventoryTransaction();
    tx.setStoreId(storeId);
    tx.setVariantId(variantId);
    tx.setTransactionType(DomainConstants.INV_TX_GOODS_RECEIPT);
    tx.setReferenceType("goods_receipt");
    tx.setReferenceId(receiptId);
    tx.setQtyChange(qty);
    tx.setQtyBefore(before);
    tx.setQtyAfter(after);
    tx.setUnitCost(line.getUnitCost());
    tx.setNote(null);
    tx.setCreatedBy(userId);
    tx.setCreatedAt(t);
    inventoryTransactionRepository.save(tx);
  }

  private static BigDecimal lineTotal(GoodsReceiptLineRequest line) {
    BigDecimal gross =
        line.quantity().multiply(line.unitCost()).setScale(4, RoundingMode.HALF_UP);
    BigDecimal net = gross.subtract(line.discountAmount());
    if (net.compareTo(BigDecimal.ZERO) < 0) {
      throw new BusinessException("Dòng chi tiết âm sau giảm giá (variant " + line.variantId() + ")");
    }
    return net;
  }

  private String nextReceiptCode() {
    String datePart = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String code = "NH-" + datePart + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!goodsReceiptRepository.existsByReceiptCode(code)) {
        return code;
      }
    }
    throw new BusinessException("Không tạo được mã phiếu nhập, thử lại.");
  }

  private GoodsReceiptResponse toResponse(GoodsReceipt r) {
    List<GoodsReceiptLineResponse> lines =
        r.getItems().stream()
            .map(
                i ->
                    new GoodsReceiptLineResponse(
                        i.getId(),
                        i.getVariantId(),
                        i.getQuantity(),
                        i.getUnitCost(),
                        i.getDiscountAmount(),
                        i.getLineTotal()))
            .toList();
    return new GoodsReceiptResponse(
        r.getId(),
        r.getReceiptCode(),
        r.getStoreId(),
        r.getSupplierId(),
        r.getReceiptDate(),
        r.getStatus(),
        r.getSubtotal(),
        r.getDiscountAmount(),
        r.getTotalAmount(),
        r.getNote(),
        r.getCreatedBy(),
        r.getApprovedBy(),
        r.getCreatedAt(),
        r.getUpdatedAt(),
        lines);
  }
}
