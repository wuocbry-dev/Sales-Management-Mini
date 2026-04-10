package com.quanlybanhang.service;

import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnCreateRequest;
import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnLineRequest;
import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnLineResponse;
import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.SalesOrder;
import com.quanlybanhang.model.SalesOrderItem;
import com.quanlybanhang.model.SalesReturn;
import com.quanlybanhang.model.SalesReturnItem;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.SalesOrderItemRepository;
import com.quanlybanhang.repository.SalesReturnRepository;
import com.quanlybanhang.repository.StoreRepository;
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
public class SalesReturnService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final SalesReturnRepository salesReturnRepository;
  private final SalesOrderRepository salesOrderRepository;
  private final SalesOrderItemRepository salesOrderItemRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final StoreRepository storeRepository;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<SalesReturnResponse> list(
      Pageable pageable, Long storeId, Long orderId, String status) {
    Specification<SalesReturn> spec =
        (root, query, cb) -> {
          var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
          if (storeId != null) {
            preds.add(cb.equal(root.get("storeId"), storeId));
          }
          if (orderId != null) {
            preds.add(cb.equal(root.get("orderId"), orderId));
          }
          if (status != null && !status.isBlank()) {
            preds.add(cb.equal(root.get("status"), status.trim()));
          }
          if (preds.isEmpty()) {
            return cb.conjunction();
          }
          return cb.and(preds.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    return salesReturnRepository.findAll(spec, pageable).map(this::toSummary);
  }

  public SalesReturnResponse get(Long id) {
    SalesReturn r =
        salesReturnRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu trả không tồn tại: " + id));
    return toFull(r);
  }

  @Transactional
  public SalesReturnResponse createDraft(SalesReturnCreateRequest req, long processedByUserId) {
    if (!storeRepository.existsById(req.storeId())) {
      throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
    }
    SalesOrder order =
        salesOrderRepository
            .findWithItemsById(req.orderId())
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + req.orderId()));
    if (!DomainConstants.ORDER_COMPLETED.equals(order.getStatus())) {
      throw new BusinessException("Chỉ trả hàng cho đơn đã hoàn tất.");
    }
    if (!order.getStoreId().equals(req.storeId())) {
      throw new BusinessException("Cửa hàng không khớp với đơn gốc.");
    }
    Long customerId = req.customerId() != null ? req.customerId() : order.getCustomerId();

    LocalDateTime t = now();
    SalesReturn sr = new SalesReturn();
    sr.setReturnCode(nextReturnCode());
    sr.setOrderId(req.orderId());
    sr.setStoreId(req.storeId());
    sr.setCustomerId(customerId);
    sr.setProcessedBy(processedByUserId);
    sr.setReturnDate(req.returnDate());
    sr.setStatus(DomainConstants.RETURN_DRAFT);
    sr.setNote(req.note());
    sr.setCreatedAt(t);

    BigDecimal refund = BigDecimal.ZERO;
    for (SalesReturnLineRequest line : req.lines()) {
      SalesOrderItem oi =
          salesOrderItemRepository
              .findByIdAndSalesOrder_Id(line.orderItemId(), order.getId())
              .orElseThrow(
                  () ->
                      new BusinessException(
                          "Dòng đơn không thuộc đơn này: orderItemId=" + line.orderItemId()));
      if (!oi.getVariantId().equals(line.variantId())) {
        throw new BusinessException("variantId không khớp dòng đơn " + line.orderItemId());
      }
      if (oi.getUnitPrice().setScale(4, RoundingMode.HALF_UP).compareTo(
              line.unitPrice().setScale(4, RoundingMode.HALF_UP))
          != 0) {
        throw new BusinessException("Đơn giá trả phải khớp đơn giá trên đơn bán.");
      }
      BigDecimal lineTotal =
          line.quantity().multiply(line.unitPrice()).setScale(4, RoundingMode.HALF_UP);
      refund = refund.add(lineTotal);
      SalesReturnItem item = new SalesReturnItem();
      item.setOrderItemId(line.orderItemId());
      item.setVariantId(line.variantId());
      item.setQuantity(line.quantity());
      item.setUnitPrice(line.unitPrice());
      item.setLineTotal(lineTotal);
      item.setReason(line.reason());
      sr.addLine(item);
    }
    sr.setRefundAmount(refund);
    salesReturnRepository.save(sr);
    return get(sr.getId());
  }

  @Transactional
  public SalesReturnResponse confirm(Long id, long userId) {
    SalesReturn sr =
        salesReturnRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu trả không tồn tại: " + id));
    if (!DomainConstants.RETURN_DRAFT.equals(sr.getStatus())) {
      throw new BusinessException("Chỉ xác nhận phiếu trả ở trạng thái draft.");
    }
    if (sr.getItems().isEmpty()) {
      throw new BusinessException("Phiếu trả không có dòng chi tiết.");
    }
    SalesOrder order =
        salesOrderRepository
            .findWithItemsById(sr.getOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + sr.getOrderId()));

    for (SalesReturnItem line : sr.getItems()) {
      if (line.getOrderItemId() == null) {
        throw new BusinessException("Mỗi dòng trả cần orderItemId.");
      }
      SalesOrderItem oi =
          salesOrderItemRepository
              .findByIdAndSalesOrder_Id(line.getOrderItemId(), order.getId())
              .orElseThrow(() -> new BusinessException("Dòng đơn không hợp lệ."));
      BigDecimal already =
          salesReturnRepository.sumReturnedForLine(
              sr.getOrderId(), line.getOrderItemId(), DomainConstants.RETURN_COMPLETED);
      BigDecimal afterThis = already.add(line.getQuantity());
      if (afterThis.compareTo(oi.getQuantity()) > 0) {
        throw new BusinessException(
            "Số lượng trả vượt quá đã bán (orderItem "
                + line.getOrderItemId()
                + ", đã trả "
                + already
                + ", đơn "
                + oi.getQuantity()
                + ").");
      }
    }

    LocalDateTime t = now();
    for (SalesReturnItem line : sr.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      Inventory inv =
          inventoryRepository
              .findByStoreIdAndVariantId(sr.getStoreId(), line.getVariantId())
              .orElseGet(
                  () -> {
                    Inventory n = new Inventory();
                    n.setStoreId(sr.getStoreId());
                    n.setVariantId(line.getVariantId());
                    n.setQuantityOnHand(BigDecimal.ZERO);
                    n.setReservedQty(BigDecimal.ZERO);
                    n.setUpdatedAt(t);
                    return n;
                  });
      BigDecimal before = inv.getQuantityOnHand();
      BigDecimal qty = line.getQuantity();
      BigDecimal after = before.add(qty);
      inv.setQuantityOnHand(after);
      inv.setUpdatedAt(t);
      inventoryRepository.save(inv);

      InventoryTransaction tx = new InventoryTransaction();
      tx.setStoreId(sr.getStoreId());
      tx.setVariantId(line.getVariantId());
      tx.setTransactionType(DomainConstants.INV_TX_SALE_RETURN);
      tx.setReferenceType(DomainConstants.REF_TYPE_SALES_RETURN);
      tx.setReferenceId(sr.getId());
      tx.setQtyChange(qty);
      tx.setQtyBefore(before);
      tx.setQtyAfter(after);
      tx.setUnitCost(v.getCostPrice());
      tx.setNote(line.getReason());
      tx.setCreatedBy(userId);
      tx.setCreatedAt(t);
      inventoryTransactionRepository.save(tx);
    }

    sr.setStatus(DomainConstants.RETURN_COMPLETED);
    sr.setProcessedBy(userId);
    salesReturnRepository.save(sr);
    return get(id);
  }

  private String nextReturnCode() {
    String datePart = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String code = "TR-" + datePart + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!salesReturnRepository.existsByReturnCode(code)) {
        return code;
      }
    }
    throw new BusinessException("Không tạo được mã phiếu trả.");
  }

  private SalesReturnResponse toSummary(SalesReturn r) {
    return new SalesReturnResponse(
        r.getId(),
        r.getReturnCode(),
        r.getOrderId(),
        r.getStoreId(),
        r.getCustomerId(),
        r.getProcessedBy(),
        r.getReturnDate(),
        r.getStatus(),
        r.getRefundAmount(),
        r.getNote(),
        r.getCreatedAt(),
        List.of());
  }

  private SalesReturnResponse toFull(SalesReturn r) {
    List<SalesReturnLineResponse> lines =
        r.getItems().stream()
            .map(
                i ->
                    new SalesReturnLineResponse(
                        i.getId(),
                        i.getOrderItemId(),
                        i.getVariantId(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getLineTotal(),
                        i.getReason()))
            .toList();
    return new SalesReturnResponse(
        r.getId(),
        r.getReturnCode(),
        r.getOrderId(),
        r.getStoreId(),
        r.getCustomerId(),
        r.getProcessedBy(),
        r.getReturnDate(),
        r.getStatus(),
        r.getRefundAmount(),
        r.getNote(),
        r.getCreatedAt(),
        lines);
  }
}
