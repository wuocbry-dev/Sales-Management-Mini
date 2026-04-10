package com.quanlybanhang.service;

import com.quanlybanhang.dto.StockTransferDtos.StockTransferCreateRequest;
import com.quanlybanhang.dto.StockTransferDtos.StockTransferLineRequest;
import com.quanlybanhang.dto.StockTransferDtos.StockTransferLineResponse;
import com.quanlybanhang.dto.StockTransferDtos.StockTransferResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.StockTransfer;
import com.quanlybanhang.model.StockTransferItem;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StockTransferRepository;
import com.quanlybanhang.repository.StoreRepository;
import java.math.BigDecimal;
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
public class StockTransferService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final StockTransferRepository stockTransferRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final StoreRepository storeRepository;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<StockTransferResponse> list(
      Pageable pageable, Long fromStoreId, Long toStoreId, String status) {
    Specification<StockTransfer> spec =
        (root, query, cb) -> {
          var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
          if (fromStoreId != null) {
            preds.add(cb.equal(root.get("fromStoreId"), fromStoreId));
          }
          if (toStoreId != null) {
            preds.add(cb.equal(root.get("toStoreId"), toStoreId));
          }
          if (status != null && !status.isBlank()) {
            preds.add(cb.equal(root.get("status"), status.trim()));
          }
          if (preds.isEmpty()) {
            return cb.conjunction();
          }
          return cb.and(preds.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    return stockTransferRepository.findAll(spec, pageable).map(this::toSummary);
  }

  public StockTransferResponse get(Long id) {
    StockTransfer t =
        stockTransferRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu chuyển không tồn tại: " + id));
    return toFull(t);
  }

  @Transactional
  public StockTransferResponse createDraft(StockTransferCreateRequest req, long userId) {
    if (req.fromStoreId().equals(req.toStoreId())) {
      throw new BusinessException("Kho nguồn và kho đích phải khác nhau.");
    }
    if (!storeRepository.existsById(req.fromStoreId())
        || !storeRepository.existsById(req.toStoreId())) {
      throw new BusinessException("Cửa hàng không tồn tại.");
    }
    for (StockTransferLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
    }
    LocalDateTime t = now();
    StockTransfer st = new StockTransfer();
    st.setTransferCode(nextCode());
    st.setFromStoreId(req.fromStoreId());
    st.setToStoreId(req.toStoreId());
    st.setTransferDate(req.transferDate());
    st.setStatus(DomainConstants.TRANSFER_DRAFT);
    st.setNote(req.note());
    st.setCreatedBy(userId);
    st.setCreatedAt(t);
    st.setUpdatedAt(t);
    for (StockTransferLineRequest line : req.lines()) {
      StockTransferItem item = new StockTransferItem();
      item.setVariantId(line.variantId());
      item.setQuantity(line.quantity());
      st.addLine(item);
    }
    stockTransferRepository.save(st);
    return get(st.getId());
  }

  @Transactional
  public StockTransferResponse confirm(Long id, long userId) {
    StockTransfer st =
        stockTransferRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu chuyển không tồn tại: " + id));
    if (!DomainConstants.TRANSFER_DRAFT.equals(st.getStatus())) {
      throw new BusinessException("Chỉ xác nhận phiếu chuyển ở trạng thái draft.");
    }
    if (st.getItems().isEmpty()) {
      throw new BusinessException("Phiếu không có dòng chi tiết.");
    }
    LocalDateTime t = now();
    for (StockTransferItem line : st.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      BigDecimal qty = line.getQuantity();
      Inventory fromInv =
          inventoryRepository
              .findByStoreIdAndVariantId(st.getFromStoreId(), line.getVariantId())
              .orElseThrow(
                  () ->
                      new BusinessException(
                          "Không có tồn tại kho nguồn cho variant " + line.getVariantId()));
      BigDecimal available =
          fromInv.getQuantityOnHand().subtract(fromInv.getReservedQty());
      if (available.compareTo(qty) < 0) {
        throw new BusinessException(
            "Không đủ tồn kho nguồn (variant " + line.getVariantId() + ")");
      }
      BigDecimal fromBefore = fromInv.getQuantityOnHand();
      BigDecimal fromAfter = fromBefore.subtract(qty);
      fromInv.setQuantityOnHand(fromAfter);
      fromInv.setUpdatedAt(t);
      inventoryRepository.save(fromInv);
      recordTx(
          st.getFromStoreId(),
          line.getVariantId(),
          DomainConstants.INV_TX_TRANSFER_OUT,
          st.getId(),
          qty.negate(),
          fromBefore,
          fromAfter,
          v.getCostPrice(),
          userId,
          t);

      Inventory toInv =
          inventoryRepository
              .findByStoreIdAndVariantId(st.getToStoreId(), line.getVariantId())
              .orElseGet(
                  () -> {
                    Inventory n = new Inventory();
                    n.setStoreId(st.getToStoreId());
                    n.setVariantId(line.getVariantId());
                    n.setQuantityOnHand(BigDecimal.ZERO);
                    n.setReservedQty(BigDecimal.ZERO);
                    n.setUpdatedAt(t);
                    return n;
                  });
      BigDecimal toBefore = toInv.getQuantityOnHand();
      BigDecimal toAfter = toBefore.add(qty);
      toInv.setQuantityOnHand(toAfter);
      toInv.setUpdatedAt(t);
      inventoryRepository.save(toInv);
      recordTx(
          st.getToStoreId(),
          line.getVariantId(),
          DomainConstants.INV_TX_TRANSFER_IN,
          st.getId(),
          qty,
          toBefore,
          toAfter,
          v.getCostPrice(),
          userId,
          t);
    }
    st.setStatus(DomainConstants.TRANSFER_COMPLETED);
    st.setReceivedBy(userId);
    st.setUpdatedAt(t);
    stockTransferRepository.save(st);
    return get(id);
  }

  private void recordTx(
      Long storeId,
      Long variantId,
      String type,
      Long transferId,
      BigDecimal qtyChange,
      BigDecimal before,
      BigDecimal after,
      BigDecimal unitCost,
      long userId,
      LocalDateTime t) {
    InventoryTransaction tx = new InventoryTransaction();
    tx.setStoreId(storeId);
    tx.setVariantId(variantId);
    tx.setTransactionType(type);
    tx.setReferenceType(DomainConstants.REF_TYPE_STOCK_TRANSFER);
    tx.setReferenceId(transferId);
    tx.setQtyChange(qtyChange);
    tx.setQtyBefore(before);
    tx.setQtyAfter(after);
    tx.setUnitCost(unitCost);
    tx.setNote(null);
    tx.setCreatedBy(userId);
    tx.setCreatedAt(t);
    inventoryTransactionRepository.save(tx);
  }

  private String nextCode() {
    String d = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String c = "CK-" + d + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!stockTransferRepository.existsByTransferCode(c)) {
        return c;
      }
    }
    throw new BusinessException("Không tạo được mã phiếu chuyển.");
  }

  private StockTransferResponse toSummary(StockTransfer t) {
    return new StockTransferResponse(
        t.getId(),
        t.getTransferCode(),
        t.getFromStoreId(),
        t.getToStoreId(),
        t.getTransferDate(),
        t.getStatus(),
        t.getNote(),
        t.getCreatedBy(),
        t.getReceivedBy(),
        t.getCreatedAt(),
        t.getUpdatedAt(),
        List.of());
  }

  private StockTransferResponse toFull(StockTransfer t) {
    List<StockTransferLineResponse> lines =
        t.getItems().stream()
            .map(i -> new StockTransferLineResponse(i.getId(), i.getVariantId(), i.getQuantity()))
            .toList();
    return new StockTransferResponse(
        t.getId(),
        t.getTransferCode(),
        t.getFromStoreId(),
        t.getToStoreId(),
        t.getTransferDate(),
        t.getStatus(),
        t.getNote(),
        t.getCreatedBy(),
        t.getReceivedBy(),
        t.getCreatedAt(),
        t.getUpdatedAt(),
        lines);
  }
}
