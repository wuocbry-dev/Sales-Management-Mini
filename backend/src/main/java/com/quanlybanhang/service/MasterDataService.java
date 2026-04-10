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
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.SupplierRepository;
import com.quanlybanhang.repository.UnitRepository;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MasterDataService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final StoreRepository storeRepository;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;
  private final UnitRepository unitRepository;
  private final SupplierRepository supplierRepository;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  // --- Store ---

  public Page<StoreResponse> listStores(Pageable pageable) {
    return storeRepository.findAll(pageable).map(this::toStoreResponse);
  }

  public StoreResponse getStore(Long id) {
    return storeRepository.findById(id).map(this::toStoreResponse).orElseThrow(() -> notFound("Cửa hàng", id));
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
    e.setStatus(req.status());
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toStoreResponse(storeRepository.save(e));
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
    e.setStatus(req.status());
    e.setUpdatedAt(now());
    return toStoreResponse(storeRepository.save(e));
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

  public Page<BrandResponse> listBrands(Pageable pageable) {
    return brandRepository.findAll(pageable).map(this::toBrandResponse);
  }

  public BrandResponse getBrand(Long id) {
    return brandRepository.findById(id).map(this::toBrandResponse).orElseThrow(() -> notFound("Thương hiệu", id));
  }

  @Transactional
  public BrandResponse createBrand(BrandRequest req) {
    if (brandRepository.existsByBrandCode(req.brandCode())) {
      throw new BusinessException("Mã thương hiệu đã tồn tại: " + req.brandCode());
    }
    LocalDateTime t = now();
    Brand e = new Brand();
    e.setBrandCode(req.brandCode());
    e.setBrandName(req.brandName());
    e.setDescription(req.description());
    e.setStatus(req.status());
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toBrandResponse(brandRepository.save(e));
  }

  @Transactional
  public BrandResponse updateBrand(Long id, BrandRequest req) {
    Brand e = brandRepository.findById(id).orElseThrow(() -> notFound("Thương hiệu", id));
    if (!e.getBrandCode().equals(req.brandCode()) && brandRepository.existsByBrandCode(req.brandCode())) {
      throw new BusinessException("Mã thương hiệu đã tồn tại: " + req.brandCode());
    }
    e.setBrandCode(req.brandCode());
    e.setBrandName(req.brandName());
    e.setDescription(req.description());
    e.setStatus(req.status());
    e.setUpdatedAt(now());
    return toBrandResponse(brandRepository.save(e));
  }

  private BrandResponse toBrandResponse(Brand e) {
    return new BrandResponse(
        e.getId(),
        e.getBrandCode(),
        e.getBrandName(),
        e.getDescription(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  // --- Category ---

  public Page<CategoryResponse> listCategories(Pageable pageable) {
    return categoryRepository.findAll(pageable).map(this::toCategoryResponse);
  }

  public CategoryResponse getCategory(Long id) {
    return categoryRepository
        .findById(id)
        .map(this::toCategoryResponse)
        .orElseThrow(() -> notFound("Danh mục", id));
  }

  @Transactional
  public CategoryResponse createCategory(CategoryRequest req) {
    if (categoryRepository.existsByCategoryCode(req.categoryCode())) {
      throw new BusinessException("Mã danh mục đã tồn tại: " + req.categoryCode());
    }
    if (req.parentId() != null && !categoryRepository.existsById(req.parentId())) {
      throw new BusinessException("Danh mục cha không tồn tại: " + req.parentId());
    }
    LocalDateTime t = now();
    Category e = new Category();
    e.setParentId(req.parentId());
    e.setCategoryCode(req.categoryCode());
    e.setCategoryName(req.categoryName());
    e.setDescription(req.description());
    e.setStatus(req.status());
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toCategoryResponse(categoryRepository.save(e));
  }

  @Transactional
  public CategoryResponse updateCategory(Long id, CategoryRequest req) {
    Category e = categoryRepository.findById(id).orElseThrow(() -> notFound("Danh mục", id));
    if (!e.getCategoryCode().equals(req.categoryCode()) && categoryRepository.existsByCategoryCode(req.categoryCode())) {
      throw new BusinessException("Mã danh mục đã tồn tại: " + req.categoryCode());
    }
    if (req.parentId() != null && !categoryRepository.existsById(req.parentId())) {
      throw new BusinessException("Danh mục cha không tồn tại: " + req.parentId());
    }
    e.setParentId(req.parentId());
    e.setCategoryCode(req.categoryCode());
    e.setCategoryName(req.categoryName());
    e.setDescription(req.description());
    e.setStatus(req.status());
    e.setUpdatedAt(now());
    return toCategoryResponse(categoryRepository.save(e));
  }

  private CategoryResponse toCategoryResponse(Category e) {
    return new CategoryResponse(
        e.getId(),
        e.getParentId(),
        e.getCategoryCode(),
        e.getCategoryName(),
        e.getDescription(),
        e.getStatus(),
        e.getCreatedAt(),
        e.getUpdatedAt());
  }

  // --- Unit ---

  public Page<UnitResponse> listUnits(Pageable pageable) {
    return unitRepository.findAll(pageable).map(this::toUnitResponse);
  }

  public UnitResponse getUnit(Long id) {
    return unitRepository.findById(id).map(this::toUnitResponse).orElseThrow(() -> notFound("Đơn vị tính", id));
  }

  @Transactional
  public UnitResponse createUnit(UnitRequest req) {
    if (unitRepository.existsByUnitCode(req.unitCode())) {
      throw new BusinessException("Mã đơn vị đã tồn tại: " + req.unitCode());
    }
    Unit e = new Unit();
    e.setUnitCode(req.unitCode());
    e.setUnitName(req.unitName());
    e.setDescription(req.description());
    e.setCreatedAt(now());
    return toUnitResponse(unitRepository.save(e));
  }

  @Transactional
  public UnitResponse updateUnit(Long id, UnitRequest req) {
    Unit e = unitRepository.findById(id).orElseThrow(() -> notFound("Đơn vị tính", id));
    if (!e.getUnitCode().equals(req.unitCode()) && unitRepository.existsByUnitCode(req.unitCode())) {
      throw new BusinessException("Mã đơn vị đã tồn tại: " + req.unitCode());
    }
    e.setUnitCode(req.unitCode());
    e.setUnitName(req.unitName());
    e.setDescription(req.description());
    return toUnitResponse(unitRepository.save(e));
  }

  private UnitResponse toUnitResponse(Unit e) {
    return new UnitResponse(e.getId(), e.getUnitCode(), e.getUnitName(), e.getDescription(), e.getCreatedAt());
  }

  // --- Supplier ---

  public Page<SupplierResponse> listSuppliers(Pageable pageable) {
    return supplierRepository.findAll(pageable).map(this::toSupplierResponse);
  }

  public SupplierResponse getSupplier(Long id) {
    return supplierRepository
        .findById(id)
        .map(this::toSupplierResponse)
        .orElseThrow(() -> notFound("Nhà cung cấp", id));
  }

  @Transactional
  public SupplierResponse createSupplier(SupplierRequest req) {
    if (supplierRepository.existsBySupplierCode(req.supplierCode())) {
      throw new BusinessException("Mã NCC đã tồn tại: " + req.supplierCode());
    }
    LocalDateTime t = now();
    Supplier e = new Supplier();
    e.setSupplierCode(req.supplierCode());
    e.setSupplierName(req.supplierName());
    e.setContactPerson(req.contactPerson());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(req.status());
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    return toSupplierResponse(supplierRepository.save(e));
  }

  @Transactional
  public SupplierResponse updateSupplier(Long id, SupplierRequest req) {
    Supplier e = supplierRepository.findById(id).orElseThrow(() -> notFound("Nhà cung cấp", id));
    if (!e.getSupplierCode().equals(req.supplierCode())
        && supplierRepository.existsBySupplierCode(req.supplierCode())) {
      throw new BusinessException("Mã NCC đã tồn tại: " + req.supplierCode());
    }
    e.setSupplierCode(req.supplierCode());
    e.setSupplierName(req.supplierName());
    e.setContactPerson(req.contactPerson());
    e.setPhone(req.phone());
    e.setEmail(req.email());
    e.setAddress(req.address());
    e.setStatus(req.status());
    e.setUpdatedAt(now());
    return toSupplierResponse(supplierRepository.save(e));
  }

  private SupplierResponse toSupplierResponse(Supplier e) {
    return new SupplierResponse(
        e.getId(),
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

  private static ResourceNotFoundException notFound(String label, Long id) {
    return new ResourceNotFoundException(label + " không tồn tại: " + id);
  }
}
