package com.quanlybanhang.service;

import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.WarehouseRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WarehouseService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  public static final String CENTRAL_CODE = "CENTRAL";

  private final WarehouseRepository warehouseRepository;
  private final BranchRepository branchRepository;
  private final StoreAccessService storeAccessService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  /** Kho tổng store — tạo nếu chưa có (idempotent). */
  @Transactional
  public Warehouse ensureCentralWarehouse(long storeId) {
    return warehouseRepository
        .findByStoreIdAndWarehouseCode(storeId, CENTRAL_CODE)
        .orElseGet(() -> createCentralInternal(storeId));
  }

  private Warehouse createCentralInternal(long storeId) {
    LocalDateTime t = now();
    Warehouse w = new Warehouse();
    w.setStoreId(storeId);
    w.setBranchId(null);
    w.setWarehouseCode(CENTRAL_CODE);
    w.setWarehouseName("Kho tổng");
    w.setWarehouseType(DomainConstants.WAREHOUSE_TYPE_CENTRAL);
    w.setStatus("ACTIVE");
    w.setCreatedAt(t);
    w.setUpdatedAt(t);
    return warehouseRepository.save(w);
  }

  /** Mỗi branch một kho — mã WH-B-{branchId}. */
  @Transactional
  public Warehouse ensureBranchWarehouse(Branch branch) {
    String code = "WH-B-" + branch.getId();
    return warehouseRepository
        .findByStoreIdAndWarehouseCode(branch.getStoreId(), code)
        .orElseGet(
            () -> {
              LocalDateTime t = now();
              Warehouse w = new Warehouse();
              w.setStoreId(branch.getStoreId());
              w.setBranchId(branch.getId());
              w.setWarehouseCode(code);
              w.setWarehouseName("Kho " + branch.getBranchName());
              w.setWarehouseType(DomainConstants.WAREHOUSE_TYPE_BRANCH);
              w.setStatus("ACTIVE");
              w.setCreatedAt(t);
              w.setUpdatedAt(t);
              return warehouseRepository.save(w);
            });
  }

  public Warehouse requireById(long warehouseId) {
    return warehouseRepository
        .findById(warehouseId)
        .orElseThrow(() -> new ResourceNotFoundException("Kho không tồn tại: " + warehouseId));
  }

  public Warehouse requireCentral(long storeId) {
    return warehouseRepository
        .findByStoreIdAndWarehouseCode(storeId, CENTRAL_CODE)
        .orElseThrow(
            () ->
                new BusinessException(
                    "Chưa có kho tổng cho cửa hàng " + storeId + " — tạo cửa hàng lại hoặc chạy bootstrap."));
  }

  /** Kho bán hàng: branch → kho branch; null branch → kho tổng. */
  public Warehouse resolveFulfillmentWarehouse(long storeId, Long branchId) {
    if (branchId == null) {
      return requireCentral(storeId);
    }
    Branch b =
        branchRepository
            .findById(branchId)
            .orElseThrow(() -> new BusinessException("Chi nhánh không tồn tại: " + branchId));
    if (!b.getStoreId().equals(storeId)) {
      throw new BusinessException("Chi nhánh không thuộc cửa hàng đơn hàng.");
    }
    return warehouseRepository
        .findByBranchId(branchId)
        .orElseThrow(
            () ->
                new BusinessException(
                    "Chưa có kho cho chi nhánh "
                        + branchId
                        + " — tạo lại chi nhánh hoặc gọi ensureBranchWarehouse."));
  }

  public List<Warehouse> listByStore(long storeId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    return warehouseRepository.findByStoreIdOrderByWarehouseTypeAscWarehouseCodeAsc(storeId);
  }

  public void assertCanAccessWarehouse(long warehouseId, JwtAuthenticatedPrincipal principal) {
    Warehouse w = requireById(warehouseId);
    storeAccessService.assertCanAccessStore(w.getStoreId(), principal);
    if (w.getBranchId() != null && storeAccessService.isBranchOnlyScoped(principal)) {
      storeAccessService.assertCanAccessBranch(w.getBranchId(), principal);
    }
  }

}
