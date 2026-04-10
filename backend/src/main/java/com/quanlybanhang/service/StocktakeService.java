package com.quanlybanhang.service;

import com.quanlybanhang.dto.StocktakeDtos.StocktakeCreateRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeLineRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeLineResponse;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.Stocktake;
import com.quanlybanhang.model.StocktakeItem;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StocktakeRepository;
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
public class StocktakeService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final StocktakeRepository stocktakeRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final StoreRepository storeRepository;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<StocktakeResponse> list(Pageable pageable, Long storeId, String status) {
    Specification<Stocktake> spec =
        (root, query, cb) -> {
          var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
          if (storeId != null) {
            preds.add(cb.equal(root.get("storeId"), storeId));
          }
          if (status != null && !status.isBlank()) {
            preds.add(cb.equal(root.get("status"), status.trim()));
          }
          if (preds.isEmpty()) {
            return cb.conjunction();
          }
          return cb.and(preds.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    return stocktakeRepository.findAll(spec, pageable).map(this::toSummary);
  }

  public StocktakeResponse get(Long id) {
    Stocktake s =
        stocktakeRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu kiểm không tồn tại: " + id));
    return toFull(s);
  }

  @Transactional
  public StocktakeResponse createDraft(StocktakeCreateRequest req, long userId) {
    if (!storeRepository.existsById(req.storeId())) {
      throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
    }
    LocalDateTime t = now();
    Stocktake st = new Stocktake();
    st.setStocktakeCode(nextCode());
    st.setStoreId(req.storeId());
    st.setStocktakeDate(req.stocktakeDate());
    st.setStatus(DomainConstants.STOCKTAKE_DRAFT);
    st.setNote(req.note());
    st.setCreatedBy(userId);
    st.setCreatedAt(t);
    st.setUpdatedAt(t);

    for (StocktakeLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
      BigDecimal system =
          inventoryRepository
              .findByStoreIdAndVariantId(req.storeId(), line.variantId())
              .map(Inventory::getQuantityOnHand)
              .orElse(BigDecimal.ZERO);
      BigDecimal actual = line.actualQty();
      BigDecimal diff = actual.subtract(system).setScale(4, RoundingMode.HALF_UP);
      StocktakeItem item = new StocktakeItem();
      item.setVariantId(line.variantId());
      item.setSystemQty(system);
      item.setActualQty(actual);
      item.setDifferenceQty(diff);
      item.setNote(line.note());
      st.addLine(item);
    }
    stocktakeRepository.save(st);
    return get(st.getId());
  }

  @Transactional
  public StocktakeResponse confirm(Long id, long userId) {
    Stocktake st =
        stocktakeRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu kiểm không tồn tại: " + id));
    if (!DomainConstants.STOCKTAKE_DRAFT.equals(st.getStatus())) {
      throw new BusinessException("Chỉ xác nhận phiếu kiểm ở trạng thái draft.");
    }
    if (st.getItems().isEmpty()) {
      throw new BusinessException("Phiếu không có dòng chi tiết.");
    }
    LocalDateTime t = now();
    for (StocktakeItem line : st.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      Inventory inv =
          inventoryRepository
              .findByStoreIdAndVariantId(st.getStoreId(), line.getVariantId())
              .orElseGet(
                  () -> {
                    Inventory n = new Inventory();
                    n.setStoreId(st.getStoreId());
                    n.setVariantId(line.getVariantId());
                    n.setQuantityOnHand(BigDecimal.ZERO);
                    n.setReservedQty(BigDecimal.ZERO);
                    n.setUpdatedAt(t);
                    return n;
                  });
      BigDecimal before = inv.getQuantityOnHand();
      BigDecimal target = line.getActualQty();
      BigDecimal delta = target.subtract(before);
      inv.setQuantityOnHand(target);
      inv.setUpdatedAt(t);
      inventoryRepository.save(inv);

      InventoryTransaction tx = new InventoryTransaction();
      tx.setStoreId(st.getStoreId());
      tx.setVariantId(line.getVariantId());
      tx.setTransactionType(DomainConstants.INV_TX_STOCKTAKE_ADJUST);
      tx.setReferenceType(DomainConstants.REF_TYPE_STOCKTAKE);
      tx.setReferenceId(st.getId());
      tx.setQtyChange(delta);
      tx.setQtyBefore(before);
      tx.setQtyAfter(target);
      tx.setUnitCost(v.getCostPrice());
      tx.setNote(line.getNote());
      tx.setCreatedBy(userId);
      tx.setCreatedAt(t);
      inventoryTransactionRepository.save(tx);
    }
    st.setStatus(DomainConstants.STOCKTAKE_COMPLETED);
    st.setApprovedBy(userId);
    st.setUpdatedAt(t);
    stocktakeRepository.save(st);
    return get(id);
  }

  private String nextCode() {
    String d = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String c = "KK-" + d + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!stocktakeRepository.existsByStocktakeCode(c)) {
        return c;
      }
    }
    throw new BusinessException("Không tạo được mã phiếu kiểm.");
  }

  private StocktakeResponse toSummary(Stocktake s) {
    return new StocktakeResponse(
        s.getId(),
        s.getStocktakeCode(),
        s.getStoreId(),
        s.getStocktakeDate(),
        s.getStatus(),
        s.getNote(),
        s.getCreatedBy(),
        s.getApprovedBy(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        List.of());
  }

  private StocktakeResponse toFull(Stocktake s) {
    List<StocktakeLineResponse> lines =
        s.getItems().stream()
            .map(
                i ->
                    new StocktakeLineResponse(
                        i.getId(),
                        i.getVariantId(),
                        i.getSystemQty(),
                        i.getActualQty(),
                        i.getDifferenceQty(),
                        i.getNote()))
            .toList();
    return new StocktakeResponse(
        s.getId(),
        s.getStocktakeCode(),
        s.getStoreId(),
        s.getStocktakeDate(),
        s.getStatus(),
        s.getNote(),
        s.getCreatedBy(),
        s.getApprovedBy(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        lines);
  }
}
