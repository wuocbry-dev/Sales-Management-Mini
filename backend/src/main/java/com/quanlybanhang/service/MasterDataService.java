package com.quanlybanhang.service;

import com.quanlybanhang.dto.MasterDataDtos.BrandRequest;
import com.quanlybanhang.dto.MasterDataDtos.BrandResponse;
import com.quanlybanhang.dto.MasterDataDtos.CategoryRequest;
import com.quanlybanhang.dto.MasterDataDtos.CategoryResponse;
import com.quanlybanhang.dto.MasterDataDtos.StoreRequest;
import com.quanlybanhang.dto.MasterDataDtos.StoreResponse;
import com.quanlybanhang.dto.MasterDataDtos.SupplierRequest;
import com.quanlybanhang.dto.MasterDataDtos.SupplierResponse;
import com.quanlybanhang.dto.MasterDataDtos.UnitRequest;
import com.quanlybanhang.dto.MasterDataDtos.UnitResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Brand;
import com.quanlybanhang.model.Category;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.Supplier;
import com.quanlybanhang.model.Unit;
import com.quanlybanhang.repository.BrandRepository;
import com.quanlybanhang.repository.CategoryRepository;
import com.quanlybanhang.repository.GoodsReceiptRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.SupplierRepository;
import com.quanlybanhang.repository.UnitRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MasterDataService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;
  private final UnitRepository unitRepository;
  private final SupplierRepository supplierRepository;
  private final ProductRepository productRepository;
  private final GoodsReceiptRepository goodsReceiptRepository;
  private final WarehouseService warehouseService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  /**
   * MySQL {@code ENUM('ACTIVE','INACTIVE')} — chuỗi phải khớp đúng tên literal (thường IN hoa).
   * Khớp cách xử lý trong {@link BranchService}.
   */
  private static String normalizeActiveInactiveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return "ACTIVE";
    }
    return raw.trim().toUpperCase();
  }

  // --- Store ---

  public Page<StoreResponse> listStores(Pageable pageable, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (scope == null) {
      return storeRepository.findAll(pageable).map(this::toStoreResponse);
    }
    return storeRepository.findByIdIn(scope, pageable).map(this::toStoreResponse);
  }

  public StoreResponse getStore(Long id, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(id, principal);
    Store store =
        storeRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cửa hàng không tồn tại: " + id));
    return toStoreResponse(store);
  }

  @Transactional
  public StoreResponse createStore(StoreRequest req) {
    if (storeRepository.existsByStoreCode(req.storeCode())) {
      throw new BusinessException("Mã cửa hàng đã tồn tại: " + req.storeCode());
    }
    LocalDateTime t = now();
    Store e = new Store();
    e.setStoreCode(req.storeCode());
    e.setStoreName(req.storeName());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    Store saved = storeRepository.save(e);
    warehouseService.ensureCentralWarehouse(saved.getId());
    return toStoreResponse(saved);
  }

  @Transactional
  public StoreResponse updateStore(Long id, StoreRequest req) {
    Store e = storeRepository.findById(id).orElseThrow(() -> notFound("Cửa hàng", id));
    if (!e.getStoreCode().equals(req.storeCode()) && storeRepository.existsByStoreCode(req.storeCode())) {
      throw new BusinessException("Mã cửa hàng đã tồn tại: " + req.storeCode());
    }
    e.setStoreCode(req.storeCode());
    e.setStoreName(req.storeName());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setUpdatedAt(now());
    Store saved = storeRepository.save(e);
    warehouseService.ensureCentralWarehouse(saved.getId());
    return toStoreResponse(saved);
  }

  private StoreResponse toStoreResponse(Store e) {
    return new StoreResponse(
        e.getId(),
        e.getStoreCode(),
        e.getStoreName(),
        e.getPhone(),
        e.getEmail(),
        e.getAddress(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  // --- Brand ---

  public Page<BrandResponse> listBrands(
      Pageable pageable, Long storeId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    assertStoreFilterAccessible(storeId, scope);
    if (scope == null) {
      if (storeId != null) {
        return brandRepository.findByStoreId(storeId, pageable).map(this::toBrandResponse);
      }
      return brandRepository.findAll(pageable).map(this::toBrandResponse);
    }
    if (storeId != null) {
      return brandRepository.findByStoreId(storeId, pageable).map(this::toBrandResponse);
    }
    return brandRepository.findByStoreIdIn(scope, pageable).map(this::toBrandResponse);
  }

  public BrandResponse getBrand(Long id, JwtAuthenticatedPrincipal principal) {
    Brand e =
        brandRepository
            .findById(id)
            .orElseThrow(() -> notFound("Thương hiệu", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    return toBrandResponse(e);
  }

  @Transactional
  public BrandResponse createBrand(BrandRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForMasterCreate(req.storeId(), principal);
    if (brandRepository.existsByBrandCodeAndStoreId(req.brandCode(), storeId)) {
      throw new BusinessException("Mã thương hiệu đã tồn tại: " + req.brandCode());
    }
    LocalDateTime t = now();
    Brand e = new Brand();
    e.setStoreId(storeId);
    e.setBrandCode(req.brandCode());
    e.setBrandName(req.brandName());
    e.setDescription(req.description());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toBrandResponse(brandRepository.save(e));
  }

  @Transactional
  public BrandResponse updateBrand(Long id, BrandRequest req, JwtAuthenticatedPrincipal principal) {
    Brand e = brandRepository.findById(id).orElseThrow(() -> notFound("Thương hiệu", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (req.storeId() != null && !req.storeId().equals(e.getStoreId())) {
      throw new BusinessException("Không được thay đổi cửa hàng của thương hiệu.");
    }
    if (!e.getBrandCode().equals(req.brandCode())
        && brandRepository.existsByBrandCodeAndStoreId(req.brandCode(), e.getStoreId())) {
      throw new BusinessException("Mã thương hiệu đã tồn tại: " + req.brandCode());
    }
    e.setBrandCode(req.brandCode());
    e.setBrandName(req.brandName());
    e.setDescription(req.description());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setUpdatedAt(now());
    return toBrandResponse(brandRepository.save(e));
  }

  @Transactional
  public void deleteBrand(Long id, JwtAuthenticatedPrincipal principal) {
    Brand e = brandRepository.findById(id).orElseThrow(() -> notFound("Thương hiệu", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (productRepository.existsByBrandIdAndStoreId(id, e.getStoreId())) {
      throw new BusinessException(
          "Không thể xóa thương hiệu "
              + e.getBrandCode()
              + ": đã có sản phẩm đang sử dụng thương hiệu này.");
    }
    brandRepository.delete(e);
    brandRepository.flush();
  }

  private BrandResponse toBrandResponse(Brand e) {
    return new BrandResponse(
        e.getId(),
        e.getStoreId(),
        e.getBrandCode(),
        e.getBrandName(),
        e.getDescription(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  // --- Category ---

  public Page<CategoryResponse> listCategories(
      Pageable pageable, Long storeId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    assertStoreFilterAccessible(storeId, scope);
    if (scope == null) {
      if (storeId != null) {
        return categoryRepository.findByStoreId(storeId, pageable).map(this::toCategoryResponse);
      }
      return categoryRepository.findAll(pageable).map(this::toCategoryResponse);
    }
    if (storeId != null) {
      return categoryRepository.findByStoreId(storeId, pageable).map(this::toCategoryResponse);
    }
    return categoryRepository.findByStoreIdIn(scope, pageable).map(this::toCategoryResponse);
  }

  public CategoryResponse getCategory(Long id, JwtAuthenticatedPrincipal principal) {
    Category e = categoryRepository.findById(id).orElseThrow(() -> notFound("Danh mục", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    return toCategoryResponse(e);
  }

  @Transactional
  public CategoryResponse createCategory(CategoryRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForMasterCreate(req.storeId(), principal);
    if (categoryRepository.existsByCategoryCodeAndStoreId(req.categoryCode(), storeId)) {
      throw new BusinessException("Mã danh mục đã tồn tại: " + req.categoryCode());
    }
    if (req.parentId() != null) {
      Category parent =
          categoryRepository
              .findById(req.parentId())
              .orElseThrow(() -> new BusinessException("Danh mục cha không tồn tại: " + req.parentId()));
      if (!parent.getStoreId().equals(storeId)) {
        throw new BusinessException("Danh mục cha không thuộc cùng cửa hàng.");
      }
    }
    LocalDateTime t = now();
    Category e = new Category();
    e.setStoreId(storeId);
    e.setParentId(req.parentId());
    e.setCategoryCode(req.categoryCode());
    e.setCategoryName(req.categoryName());
    e.setDescription(req.description());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toCategoryResponse(categoryRepository.save(e));
  }

  @Transactional
  public CategoryResponse updateCategory(Long id, CategoryRequest req, JwtAuthenticatedPrincipal principal) {
    Category e = categoryRepository.findById(id).orElseThrow(() -> notFound("Danh mục", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (req.storeId() != null && !req.storeId().equals(e.getStoreId())) {
      throw new BusinessException("Không được thay đổi cửa hàng của danh mục.");
    }
    if (!e.getCategoryCode().equals(req.categoryCode())
        && categoryRepository.existsByCategoryCodeAndStoreId(req.categoryCode(), e.getStoreId())) {
      throw new BusinessException("Mã danh mục đã tồn tại: " + req.categoryCode());
    }
    if (req.parentId() != null) {
      if (req.parentId().equals(id)) {
        throw new BusinessException("Danh mục cha không hợp lệ.");
      }
      Category parent =
          categoryRepository
              .findById(req.parentId())
              .orElseThrow(() -> new BusinessException("Danh mục cha không tồn tại: " + req.parentId()));
      if (!parent.getStoreId().equals(e.getStoreId())) {
        throw new BusinessException("Danh mục cha không thuộc cùng cửa hàng.");
      }
    }
    e.setParentId(req.parentId());
    e.setCategoryCode(req.categoryCode());
    e.setCategoryName(req.categoryName());
    e.setDescription(req.description());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setUpdatedAt(now());
    return toCategoryResponse(categoryRepository.save(e));
  }

  @Transactional
  public void deleteCategory(Long id, JwtAuthenticatedPrincipal principal) {
    Category e = categoryRepository.findById(id).orElseThrow(() -> notFound("Danh mục", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (categoryRepository.existsByParentIdAndStoreId(id, e.getStoreId())) {
      throw new BusinessException(
          "Không thể xóa nhóm hàng "
              + e.getCategoryCode()
              + ": vẫn còn nhóm hàng con.");
    }
    if (productRepository.existsByCategoryIdAndStoreId(id, e.getStoreId())) {
      throw new BusinessException(
          "Không thể xóa nhóm hàng "
              + e.getCategoryCode()
              + ": đã có sản phẩm đang sử dụng nhóm hàng này.");
    }
    categoryRepository.delete(e);
    categoryRepository.flush();
  }

  private CategoryResponse toCategoryResponse(Category e) {
    return new CategoryResponse(
        e.getId(),
        e.getStoreId(),
        e.getParentId(),
        e.getCategoryCode(),
        e.getCategoryName(),
        e.getDescription(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  // --- Unit ---

  public Page<UnitResponse> listUnits(
      Pageable pageable, Long storeId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    assertStoreFilterAccessible(storeId, scope);
    if (scope == null) {
      if (storeId != null) {
        return unitRepository.findByStoreId(storeId, pageable).map(this::toUnitResponse);
      }
      return unitRepository.findAll(pageable).map(this::toUnitResponse);
    }
    if (storeId != null) {
      return unitRepository.findByStoreId(storeId, pageable).map(this::toUnitResponse);
    }
    return unitRepository.findByStoreIdIn(scope, pageable).map(this::toUnitResponse);
  }

  public UnitResponse getUnit(Long id, JwtAuthenticatedPrincipal principal) {
    Unit e = unitRepository.findById(id).orElseThrow(() -> notFound("Đơn vị tính", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    return toUnitResponse(e);
  }

  @Transactional
  public UnitResponse createUnit(UnitRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForMasterCreate(req.storeId(), principal);
    if (unitRepository.existsByUnitCodeAndStoreId(req.unitCode(), storeId)) {
      throw new BusinessException("Mã đơn vị đã tồn tại: " + req.unitCode());
    }
    Unit e = new Unit();
    e.setStoreId(storeId);
    e.setUnitCode(req.unitCode());
    e.setUnitName(req.unitName());
    e.setDescription(req.description());
    e.setCreatedAt(now());
    return toUnitResponse(unitRepository.save(e));
  }

  @Transactional
  public UnitResponse updateUnit(Long id, UnitRequest req, JwtAuthenticatedPrincipal principal) {
    Unit e = unitRepository.findById(id).orElseThrow(() -> notFound("Đơn vị tính", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (req.storeId() != null && !req.storeId().equals(e.getStoreId())) {
      throw new BusinessException("Không được thay đổi cửa hàng của đơn vị tính.");
    }
    if (!e.getUnitCode().equals(req.unitCode())
        && unitRepository.existsByUnitCodeAndStoreId(req.unitCode(), e.getStoreId())) {
      throw new BusinessException("Mã đơn vị đã tồn tại: " + req.unitCode());
    }
    e.setUnitCode(req.unitCode());
    e.setUnitName(req.unitName());
    e.setDescription(req.description());
    return toUnitResponse(unitRepository.save(e));
  }

  @Transactional
  public void deleteUnit(Long id, JwtAuthenticatedPrincipal principal) {
    Unit e = unitRepository.findById(id).orElseThrow(() -> notFound("Đơn vị tính", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (productRepository.existsByUnitIdAndStoreId(id, e.getStoreId())) {
      throw new BusinessException(
          "Không thể xóa đơn vị tính "
              + e.getUnitCode()
              + ": đã có sản phẩm đang sử dụng đơn vị này.");
    }
    unitRepository.delete(e);
    unitRepository.flush();
  }

  private UnitResponse toUnitResponse(Unit e) {
    return new UnitResponse(
        e.getId(), e.getStoreId(), e.getUnitCode(), e.getUnitName(), e.getDescription(), e.getCreatedAt());
  }

  // --- Supplier ---

  public Page<SupplierResponse> listSuppliers(
      Pageable pageable, Long storeId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    assertStoreFilterAccessible(storeId, scope);
    if (scope == null) {
      if (storeId != null) {
        return supplierRepository.findByStoreId(storeId, pageable).map(this::toSupplierResponse);
      }
      return supplierRepository.findAll(pageable).map(this::toSupplierResponse);
    }
    if (storeId != null) {
      return supplierRepository.findByStoreId(storeId, pageable).map(this::toSupplierResponse);
    }
    return supplierRepository.findByStoreIdIn(scope, pageable).map(this::toSupplierResponse);
  }

  public SupplierResponse getSupplier(Long id, JwtAuthenticatedPrincipal principal) {
    Supplier e = supplierRepository.findById(id).orElseThrow(() -> notFound("Nhà cung cấp", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    return toSupplierResponse(e);
  }

  @Transactional
  public SupplierResponse createSupplier(SupplierRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForMasterCreate(req.storeId(), principal);
    if (supplierRepository.existsBySupplierCodeAndStoreId(req.supplierCode(), storeId)) {
      throw new BusinessException("Mã NCC đã tồn tại: " + req.supplierCode());
    }
    LocalDateTime t = now();
    Supplier e = new Supplier();
    e.setStoreId(storeId);
    e.setSupplierCode(req.supplierCode());
    e.setSupplierName(req.supplierName());
    e.setContactPerson(req.contactPerson());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toSupplierResponse(supplierRepository.save(e));
  }

  @Transactional
  public SupplierResponse updateSupplier(
      Long id, SupplierRequest req, JwtAuthenticatedPrincipal principal) {
    Supplier e = supplierRepository.findById(id).orElseThrow(() -> notFound("Nhà cung cấp", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (req.storeId() != null && !req.storeId().equals(e.getStoreId())) {
      throw new BusinessException("Không được thay đổi cửa hàng của nhà cung cấp.");
    }
    if (!e.getSupplierCode().equals(req.supplierCode())
        && supplierRepository.existsBySupplierCodeAndStoreId(req.supplierCode(), e.getStoreId())) {
      throw new BusinessException("Mã NCC đã tồn tại: " + req.supplierCode());
    }
    e.setSupplierCode(req.supplierCode());
    e.setSupplierName(req.supplierName());
    e.setContactPerson(req.contactPerson());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(normalizeActiveInactiveStatus(req.status()));
    e.setUpdatedAt(now());
    return toSupplierResponse(supplierRepository.save(e));
  }

  @Transactional
  public void deleteSupplier(Long id, JwtAuthenticatedPrincipal principal) {
    Supplier e = supplierRepository.findById(id).orElseThrow(() -> notFound("Nhà cung cấp", id));
    storeAccessService.assertCanAccessStore(e.getStoreId(), principal);
    if (goodsReceiptRepository.existsBySupplierIdAndStoreId(id, e.getStoreId())) {
      throw new BusinessException(
          "Không thể xóa nhà cung cấp "
              + e.getSupplierCode()
              + ": đã phát sinh phiếu nhập hàng.");
    }
    supplierRepository.delete(e);
    supplierRepository.flush();
  }

  private SupplierResponse toSupplierResponse(Supplier e) {
    return new SupplierResponse(
        e.getId(),
        e.getStoreId(),
        e.getSupplierCode(),
        e.getSupplierName(),
        e.getContactPerson(),
        e.getPhone(),
        e.getEmail(),
        e.getAddress(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  private long resolveStoreIdForMasterCreate(Long requestedStoreId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (scope == null) {
      if (requestedStoreId == null) {
        throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
      }
      if (!storeRepository.existsById(requestedStoreId)) {
        throw new BusinessException("Cửa hàng không tồn tại: " + requestedStoreId);
      }
      return requestedStoreId;
    }
    if (requestedStoreId != null) {
      storeAccessService.assertCanAccessStore(requestedStoreId, principal);
      return requestedStoreId;
    }
    if (scope.size() == 1) {
      return scope.get(0);
    }
    throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
  }

  private void assertStoreFilterAccessible(Long storeId, List<Long> scope) {
    if (storeId == null) {
      return;
    }
    if (!storeRepository.existsById(storeId)) {
      throw new BusinessException("Cửa hàng không tồn tại: " + storeId);
    }
    if (scope != null && !scope.contains(storeId)) {
      throw new AccessDeniedException("Không có quyền xem cửa hàng này.");
    }
  }

  private static ResourceNotFoundException notFound(String label, Long id) {
    return new ResourceNotFoundException(label + " không tồn tại: " + id);
  }
}
