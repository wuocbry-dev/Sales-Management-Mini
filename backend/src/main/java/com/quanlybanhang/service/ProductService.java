package com.quanlybanhang.service;

import com.quanlybanhang.dto.ProductDtos.ProductCreateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductResponse;
import com.quanlybanhang.dto.ProductDtos.ProductVariantOptionResponse;
import com.quanlybanhang.dto.ProductDtos.ProductVariantRequest;
import com.quanlybanhang.dto.ProductDtos.ProductVariantResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Product;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.repository.BrandRepository;
import com.quanlybanhang.repository.CategoryRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UnitRepository;
import com.quanlybanhang.repository.spec.ProductSpecifications;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final ProductRepository productRepository;
  private final ProductVariantRepository variantRepository;
  private final CategoryRepository categoryRepository;
  private final BrandRepository brandRepository;
  private final UnitRepository unitRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  private static String normalizeActiveInactiveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return "ACTIVE";
    }
    return raw.trim().toUpperCase();
  }

  /**
   * MySQL {@code products.product_type} thường là ENUM {@code NORMAL}, {@code SERVICE}
   * (xem {@code Docx/sql/DataBase.sql}). Form cũ gửi {@code simple} / {@code variant} → cần
   * chuẩn hóa trước khi lưu, tránh 409 DATA_INTEGRITY.
   */
  private static String normalizeProductType(String raw) {
    if (raw == null || raw.isBlank()) {
      return "NORMAL";
    }
    String s = raw.trim().toLowerCase(Locale.ROOT);
    if (s.equals("simple") || s.equals("normal")) {
      return "NORMAL";
    }
    if (s.equals("service")) {
      return "SERVICE";
    }
    if (s.equals("variant")) {
      return "NORMAL";
    }
    String u = raw.trim().toUpperCase(Locale.ROOT);
    if ("NORMAL".equals(u) || "SERVICE".equals(u)) {
      return u;
    }
    return "NORMAL";
  }

  private long resolveStoreIdForCreate(ProductCreateRequest req, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (scope == null) {
      if (req.storeId() == null) {
        throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
      }
      if (!storeRepository.existsById(req.storeId())) {
        throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
      }
      return req.storeId();
    }
    if (req.storeId() != null) {
      storeAccessService.assertCanAccessStore(req.storeId(), principal);
      return req.storeId();
    }
    if (scope.size() == 1) {
      return scope.getFirst();
    }
    throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
  }

  public Page<ProductResponse> listProducts(
      Pageable pageable,
      String status,
      Long categoryId,
      Long brandId,
      String q,
      JwtAuthenticatedPrincipal principal) {
    List<Long> storeScope = storeAccessService.dataStoreScopeOrDeny(principal);
    Specification<Product> spec =
        ProductSpecifications.filter(status, categoryId, brandId, q, storeScope);
    Page<Product> page = productRepository.findAll(spec, pageable);
    List<Long> ids = page.getContent().stream().map(Product::getId).toList();
    if (ids.isEmpty()) {
      return new PageImpl<>(List.of(), pageable, page.getTotalElements());
    }
    List<ProductVariant> allVar = variantRepository.findByProductIdIn(ids);
    Map<Long, List<ProductVariant>> byProduct =
        allVar.stream().collect(Collectors.groupingBy(ProductVariant::getProductId));
    List<ProductResponse> content =
        page.getContent().stream()
            .map(
                p ->
                    toProductResponse(
                        p,
                        byProduct.getOrDefault(p.getId(), List.of()).stream()
                            .map(this::toVariantResponse)
                            .toList()))
            .toList();
    return new PageImpl<>(content, pageable, page.getTotalElements());
  }

  public List<ProductVariantOptionResponse> searchVariantOptions(
      long storeId, String q, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    String term = q == null ? "" : q.trim();
    if (term.isEmpty()) {
      return List.of();
    }
    if (term.length() > 100) {
      term = term.substring(0, 100);
    }
    return variantRepository
        .searchOptionsByStore(storeId, term, PageRequest.of(0, 40))
        .stream()
        .map(
            row ->
                new ProductVariantOptionResponse(
                    row.getId(), row.getSku(), row.getVariantName(), row.getProductName()))
        .toList();
  }

  public ProductResponse getProduct(Long id, JwtAuthenticatedPrincipal principal) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + id));
    storeAccessService.assertCanAccessStore(p.getStoreId(), principal);
    List<ProductVariantResponse> vars =
        variantRepository.findByProductId(id).stream().map(this::toVariantResponse).toList();
    return toProductResponse(p, vars);
  }

  @Transactional
  public ProductResponse createProduct(ProductCreateRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForCreate(req, principal);
    if (productRepository.existsByProductCodeAndStoreId(req.productCode(), storeId)) {
      throw new BusinessException("Mã sản phẩm đã tồn tại trong cửa hàng: " + req.productCode());
    }
    validateFks(req);
    Set<String> skusInRequest = new HashSet<>();
    for (ProductVariantRequest v : req.variants()) {
      String sku = v.sku().trim();
      if (!skusInRequest.add(sku)) {
        throw new BusinessException("Trùng SKU trong cùng yêu cầu: " + sku);
      }
      if (variantRepository.existsBySkuAndProductStoreId(sku, storeId)) {
        throw new BusinessException("SKU đã tồn tại trong cửa hàng: " + sku);
      }
    }
    LocalDateTime t = now();
    Product p = new Product();
    p.setStoreId(storeId);
    p.setCategoryId(req.categoryId());
    p.setBrandId(req.brandId());
    p.setUnitId(req.unitId());
    p.setProductCode(req.productCode());
    p.setProductName(req.productName());
    p.setProductType(normalizeProductType(req.productType()));
    p.setHasVariant(req.hasVariant());
    p.setTrackInventory(req.trackInventory());
    p.setDescription(req.description());
    p.setStatus(normalizeActiveInactiveStatus(req.status()));
    p.setCreatedAt(t);
    p.setUpdatedAt(t);
    productRepository.save(p);

    List<ProductVariantResponse> varResponses = new ArrayList<>();
    for (ProductVariantRequest vr : req.variants()) {
      ProductVariant pv = new ProductVariant();
      pv.setProductId(p.getId());
      pv.setSku(vr.sku());
      pv.setBarcode(vr.barcode());
      pv.setVariantName(vr.variantName());
      pv.setAttributesJson(vr.attributesJson());
      pv.setCostPrice(vr.costPrice());
      pv.setSellingPrice(vr.sellingPrice());
      pv.setReorderLevel(vr.reorderLevel());
      pv.setStatus(normalizeActiveInactiveStatus(vr.status()));
      pv.setCreatedAt(t);
      pv.setUpdatedAt(t);
      variantRepository.save(pv);
      varResponses.add(toVariantResponse(pv));
    }
    return toProductResponse(p, varResponses);
  }

  private void validateFks(ProductCreateRequest req) {
    if (req.categoryId() != null && !categoryRepository.existsById(req.categoryId())) {
      throw new BusinessException("Danh mục không tồn tại: " + req.categoryId());
    }
    if (req.brandId() != null && !brandRepository.existsById(req.brandId())) {
      throw new BusinessException("Thương hiệu không tồn tại: " + req.brandId());
    }
    if (req.unitId() != null && !unitRepository.existsById(req.unitId())) {
      throw new BusinessException("Đơn vị tính không tồn tại: " + req.unitId());
    }
  }

  private ProductResponse toProductResponse(Product p, List<ProductVariantResponse> variants) {
    return new ProductResponse(
        p.getId(),
        p.getStoreId(),
        p.getCategoryId(),
        p.getBrandId(),
        p.getUnitId(),
        p.getProductCode(),
        p.getProductName(),
        p.getProductType(),
        p.getHasVariant(),
        p.getTrackInventory(),
        p.getDescription(),
        p.getStatus(),
        p.getCreatedAt(),
        p.getUpdatedAt(),
        variants);
  }

  private ProductVariantResponse toVariantResponse(ProductVariant v) {
    return new ProductVariantResponse(
        v.getId(),
        v.getProductId(),
        v.getSku(),
        v.getBarcode(),
        v.getVariantName(),
        v.getAttributesJson(),
        v.getCostPrice(),
        v.getSellingPrice(),
        v.getReorderLevel(),
        v.getStatus(),
        v.getCreatedAt(),
        v.getUpdatedAt());
  }
}
