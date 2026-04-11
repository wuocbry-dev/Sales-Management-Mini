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
import com.quanlybanhang.model.Product;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.StockTransfer;
import com.quanlybanhang.model.StockTransferItem;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StockTransferRepository;
import com.quanlybanhang.repository.WarehouseRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
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
  private final ProductRepository productRepository;
  private final WarehouseRepository warehouseRepository;
  private final StoreAccessService storeAccessService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<StockTransferResponse> list(
      Pageable pageable,
      Long fromWarehouseId,
      Long toWarehouseId,
      String status,
      JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    List<Long> whScope = warehouseIdsForStoreScope(scope);
    Specification<StockTransfer> spec =
        (root, query, cb) -> {
          var preds = new ArrayList<jakarta.persistence.criteria.Predicate>();
          if (whScope != null) {
            preds.add(
                cb.or(
                    root.get("fromWarehouseId").in(whScope),
                    root.get("toWarehouseId").in(whScope)));
          }
          if (fromWarehouseId != null) {
            preds.add(cb.equal(root.get("fromWarehouseId"), fromWarehouseId));
            if (whScope != null && !whScope.contains(fromWarehouseId)) {
              throw new AccessDeniedException("Không có quyền xem kho nguồn này.");
            }
          }
          if (toWarehouseId != null) {
            preds.add(cb.equal(root.get("toWarehouseId"), toWarehouseId));
            if (whScope != null && !whScope.contains(toWarehouseId)) {
              throw new AccessDeniedException("Không có quyền xem kho đích này.");
            }
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

  private List<Long> warehouseIdsForStoreScope(List<Long> storeScope) {
    if (storeScope == null) {
      return null;
    }
    return warehouseRepository.findByStoreIdIn(storeScope).stream().map(Warehouse::getId).toList();
  }

  public StockTransferResponse get(Long id, JwtAuthenticatedPrincipal principal) {
    StockTransfer t =
        stockTransferRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu chuyển không tồn tại: " + id));
    assertTransferWarehousesAllowed(t.getFromWarehouseId(), t.getToWarehouseId(), principal);
    return toFull(t);
  }

  @Transactional
  public StockTransferResponse createDraft(
      StockTransferCreateRequest req, long userId, JwtAuthenticatedPrincipal principal) {
    Warehouse from = warehouseRepository.findById(req.fromWarehouseId()).orElseThrow();
    Warehouse to = warehouseRepository.findById(req.toWarehouseId()).orElseThrow();
    assertTransferWarehousesAllowed(from.getId(), to.getId(), principal);
    if (!from.getStoreId().equals(to.getStoreId())) {
      throw new BusinessException("Chỉ chuyển trong cùng một cửa hàng.");
    }
    if (from.getId().equals(to.getId())) {
      throw new BusinessException("Kho nguồn và kho đích phải khác nhau.");
    }
    for (StockTransferLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
    }
    LocalDateTime t = now();
    StockTransfer st = new StockTransfer();
    st.setTransferCode(nextCode());
    st.setFromWarehouseId(from.getId());
    st.setToWarehouseId(to.getId());
    st.setFromStoreId(from.getStoreId());
    st.setToStoreId(to.getStoreId());
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
    return get(st.getId(), principal);
  }

  /** Trừ tồn kho nguồn — chỉ gọi khi trạng thái draft. */
  @Transactional
  public StockTransferResponse send(Long id, long userId, JwtAuthenticatedPrincipal principal) {
    StockTransfer st =
        stockTransferRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu chuyển không tồn tại: " + id));
    assertTransferWarehousesAllowed(st.getFromWarehouseId(), st.getToWarehouseId(), principal);
    if (!DomainConstants.TRANSFER_DRAFT.equals(st.getStatus())) {
      throw new BusinessException("Chỉ gửi được phiếu ở trạng thái draft.");
    }
    if (st.getItems().isEmpty()) {
      throw new BusinessException("Phiếu không có dòng chi tiết.");
    }
    LocalDateTime t = now();
    long fromWh = st.getFromWarehouseId();
    long fromStoreId = warehouseRepository.findById(fromWh).orElseThrow().getStoreId();
    for (StockTransferItem line : st.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      BigDecimal qty = line.getQuantity();
      Inventory fromInv =
          inventoryRepository
              .findByWarehouseIdAndVariantId(fromWh, line.getVariantId())
              .orElseThrow(
                  () ->
                      new BusinessException(
                          "Không có tồn tại kho nguồn cho variant " + line.getVariantId()));
      BigDecimal available = fromInv.getQuantityOnHand().subtract(fromInv.getReservedQty());
      if (available.compareTo(qty) < 0) {
        throw new BusinessException("Không đủ tồn kho nguồn (variant " + line.getVariantId() + ")");
      }
      BigDecimal fromBefore = fromInv.getQuantityOnHand();
      BigDecimal fromAfter = fromBefore.subtract(qty);
      if (fromInv.getStoreId() == null) {
        fromInv.setStoreId(
            warehouseRepository.findById(fromWh).orElseThrow().getStoreId());
      }
      fromInv.setQuantityOnHand(fromAfter);
      fromInv.setUpdatedAt(t);
      inventoryRepository.save(fromInv);
      recordTx(
          fromStoreId,
          fromWh,
          line.getVariantId(),
          DomainConstants.INV_TX_TRANSFER_OUT,
          st.getId(),
          qty.negate(),
          fromBefore,
          fromAfter,
          v.getCostPrice(),
          userId,
          t);
    }
    st.setStatus(DomainConstants.TRANSFER_SENT);
    st.setUpdatedAt(t);
    stockTransferRepository.save(st);
    return get(id, principal);
  }

  /** Cộng tồn kho đích — chỉ sau khi đã sent. */
  @Transactional
  public StockTransferResponse receive(Long id, long userId, JwtAuthenticatedPrincipal principal) {
    StockTransfer st =
        stockTransferRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu chuyển không tồn tại: " + id));
    assertTransferWarehousesAllowed(st.getFromWarehouseId(), st.getToWarehouseId(), principal);
    if (!DomainConstants.TRANSFER_SENT.equals(st.getStatus())) {
      throw new BusinessException("Chỉ nhận được phiếu đã gửi (sent).");
    }
    LocalDateTime t = now();
    long toWh = st.getToWarehouseId();
    long toStoreId = warehouseRepository.findById(toWh).orElseThrow().getStoreId();
    for (StockTransferItem line : st.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      BigDecimal qty = line.getQuantity();
      Inventory toInv =
          inventoryRepository
              .findByWarehouseIdAndVariantId(toWh, line.getVariantId())
              .orElseGet(
                  () -> {
                    Inventory n = new Inventory();
                    n.setStoreId(toStoreId);
                    n.setWarehouseId(toWh);
                    n.setVariantId(line.getVariantId());
                    n.setQuantityOnHand(BigDecimal.ZERO);
                    n.setReservedQty(BigDecimal.ZERO);
                    n.setUpdatedAt(t);
                    return n;
                  });
      if (toInv.getStoreId() == null) {
        toInv.setStoreId(toStoreId);
      }
      BigDecimal toBefore = toInv.getQuantityOnHand();
      BigDecimal toAfter = toBefore.add(qty);
      toInv.setQuantityOnHand(toAfter);
      toInv.setUpdatedAt(t);
      inventoryRepository.save(toInv);
      recordTx(
          toStoreId,
          toWh,
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
    return get(id, principal);
  }

  private void assertTransferWarehousesAllowed(
      long fromWarehouseId, long toWarehouseId, JwtAuthenticatedPrincipal principal) {
    Warehouse from = warehouseRepository.findById(fromWarehouseId).orElseThrow();
    Warehouse to = warehouseRepository.findById(toWarehouseId).orElseThrow();
    storeAccessService.assertCanAccessStore(from.getStoreId(), principal);
    storeAccessService.assertCanAccessStore(to.getStoreId(), principal);
    if (from.getBranchId() != null && storeAccessService.isBranchOnlyScoped(principal)) {
      storeAccessService.assertCanAccessBranch(from.getBranchId(), principal);
    }
    if (to.getBranchId() != null && storeAccessService.isBranchOnlyScoped(principal)) {
      storeAccessService.assertCanAccessBranch(to.getBranchId(), principal);
    }
  }

  private void recordTx(
      Long storeId,
      Long warehouseId,
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
    tx.setWarehouseId(warehouseId);
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
        t.getFromWarehouseId(),
        t.getToWarehouseId(),
        null,
        null,
        null,
        null,
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
    Warehouse fromWh = warehouseRepository.findById(t.getFromWarehouseId()).orElse(null);
    Warehouse toWh = warehouseRepository.findById(t.getToWarehouseId()).orElse(null);
    List<StockTransferLineResponse> lines = buildLineResponses(t.getItems());
    return new StockTransferResponse(
        t.getId(),
        t.getTransferCode(),
        t.getFromWarehouseId(),
        t.getToWarehouseId(),
        fromWh != null ? fromWh.getWarehouseCode() : null,
        fromWh != null ? fromWh.getWarehouseName() : null,
        toWh != null ? toWh.getWarehouseCode() : null,
        toWh != null ? toWh.getWarehouseName() : null,
        t.getTransferDate(),
        t.getStatus(),
        t.getNote(),
        t.getCreatedBy(),
        t.getReceivedBy(),
        t.getCreatedAt(),
        t.getUpdatedAt(),
        lines);
  }

  private List<StockTransferLineResponse> buildLineResponses(List<StockTransferItem> items) {
    if (items.isEmpty()) {
      return List.of();
    }
    List<Long> variantIds =
        items.stream().map(StockTransferItem::getVariantId).filter(Objects::nonNull).distinct().toList();
    Map<Long, ProductVariant> variantById =
        variantRepository.findAllById(variantIds).stream()
            .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
    List<Long> productIds =
        variantById.values().stream().map(ProductVariant::getProductId).filter(Objects::nonNull).distinct().toList();
    Map<Long, Product> productById =
        productRepository.findAllById(productIds).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));
    return items.stream()
        .map(
            i -> {
              ProductVariant v = variantById.get(i.getVariantId());
              if (v == null) {
                return new StockTransferLineResponse(
                    i.getId(), i.getVariantId(), i.getQuantity(), null, null, null);
              }
              Product p = productById.get(v.getProductId());
              return new StockTransferLineResponse(
                  i.getId(),
                  i.getVariantId(),
                  i.getQuantity(),
                  v.getSku(),
                  v.getVariantName(),
                  p != null ? p.getProductName() : null);
            })
        .toList();
  }
}
