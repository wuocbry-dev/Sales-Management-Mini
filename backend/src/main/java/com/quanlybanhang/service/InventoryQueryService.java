package com.quanlybanhang.service;

import com.quanlybanhang.dto.InventoryDtos.InventoryResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryTransactionResponse;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.repository.spec.InventoryTransactionSpecifications;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryQueryService {

  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final StoreAccessService storeAccessService;

  public Page<InventoryResponse> listByStore(
      Long storeId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    return inventoryRepository
        .findByStoreId(storeId, pageable)
        .map(
            i ->
                new InventoryResponse(
                    i.getId(),
                    i.getStoreId(),
                    i.getVariantId(),
                    i.getQuantityOnHand(),
                    i.getReservedQty(),
                    i.getUpdatedAt()));
  }

  public Page<InventoryTransactionResponse> listTransactions(
      Long storeId,
      String transactionType,
      Long variantId,
      LocalDateTime fromCreatedAt,
      LocalDateTime toCreatedAt,
      Pageable pageable,
      JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    Specification<InventoryTransaction> spec =
        InventoryTransactionSpecifications.filter(
            storeId, transactionType, variantId, fromCreatedAt, toCreatedAt);
    return inventoryTransactionRepository
        .findAll(spec, pageable)
        .map(
            t ->
                new InventoryTransactionResponse(
                    t.getId(),
                    t.getStoreId(),
                    t.getVariantId(),
                    t.getTransactionType(),
                    t.getReferenceType(),
                    t.getReferenceId(),
                    t.getQtyChange(),
                    t.getQtyBefore(),
                    t.getQtyAfter(),
                    t.getUnitCost(),
                    t.getNote(),
                    t.getCreatedBy(),
                    t.getCreatedAt()));
  }
}
