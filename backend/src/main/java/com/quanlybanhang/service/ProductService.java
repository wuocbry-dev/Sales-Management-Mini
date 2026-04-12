package com.quanlybanhang.service;

import com.quanlybanhang.dto.ProductDtos.ProductCreateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductImageResponse;
import com.quanlybanhang.dto.ProductDtos.ProductResponse;
import com.quanlybanhang.dto.ProductDtos.ProductUpdateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductVariantOptionResponse;
import com.quanlybanhang.dto.ProductDtos.ProductVariantRequest;
import com.quanlybanhang.dto.ProductDtos.ProductVariantResponse;
import com.quanlybanhang.dto.ProductDtos.ProductVariantUpsertRequest;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Product;
import com.quanlybanhang.model.ProductImage;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.repository.BrandRepository;
import com.quanlybanhang.repository.CategoryRepository;
import com.quanlybanhang.repository.ProductImageRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UnitRepository;
import com.quanlybanhang.repository.spec.ProductSpecifications;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  private static final int MAX_IMAGES_PER_PRODUCT = 4;
  private static final long MAX_IMAGE_BYTES = 2L * 1024L * 1024L;

  private final ProductRepository productRepository;
  private final ProductVariantRepository variantRepository;
  private final ProductImageRepository productImageRepository;
  private final CategoryRepository categoryRepository;
  private final BrandRepository brandRepository;
  private final UnitRepository unitRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;

  @Value("${app.upload.product-images-dir:uploads/products}")
  private String productImagesDir;

  public record ProductImageFile(Resource resource, String contentType, String fileName) {}

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
    List<ProductImage> allImages = productImageRepository.findByProductIdInOrderByProductIdAscSortOrderAscIdAsc(ids);
    Map<Long, List<ProductVariant>> byProduct =
        allVar.stream().collect(Collectors.groupingBy(ProductVariant::getProductId));
    Map<Long, List<ProductImageResponse>> imagesByProduct =
      allImages.stream()
        .collect(
          Collectors.groupingBy(
            ProductImage::getProductId,
            Collectors.mapping(this::toImageResponse, Collectors.toList())));
    List<ProductResponse> content =
        page.getContent().stream()
            .map(
                p ->
                    toProductResponse(
                        p,
                        byProduct.getOrDefault(p.getId(), List.of()).stream()
                            .map(this::toVariantResponse)
                .toList(),
              imagesByProduct.getOrDefault(p.getId(), List.of())))
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
                    row.getId(),
                    row.getSku(),
                    row.getVariantName(),
                    row.getProductName(),
                    row.getSellingPrice()))
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
    List<ProductImageResponse> images =
        productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(id).stream()
            .map(this::toImageResponse)
            .toList();
    return toProductResponse(p, vars, images);
  }

  @Transactional
  public ProductResponse createProduct(ProductCreateRequest req, JwtAuthenticatedPrincipal principal) {
    return createProduct(req, List.of(), principal);
  }

  @Transactional
  public ProductResponse createProduct(
      ProductCreateRequest req, List<MultipartFile> images, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForCreate(req, principal);
    if (productRepository.existsByProductCodeAndStoreId(req.productCode(), storeId)) {
      throw new BusinessException("Mã sản phẩm đã tồn tại trong cửa hàng: " + req.productCode());
    }
    validateProductFks(req.categoryId(), req.brandId(), req.unitId());
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
    List<ProductImageResponse> imageResponses = saveProductImages(p, images, t);
    return toProductResponse(p, varResponses, imageResponses);
  }

  @Transactional(readOnly = true)
  public ProductImageFile loadProductImageFile(
      Long imageId, JwtAuthenticatedPrincipal principal) {
    ProductImage image =
        productImageRepository
            .findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("Ảnh sản phẩm không tồn tại: " + imageId));
    Product product =
        productRepository
            .findById(image.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + image.getProductId()));
    storeAccessService.assertCanAccessStore(product.getStoreId(), principal);

    Path root = Path.of(productImagesDir).toAbsolutePath().normalize();
    Path filePath = root.resolve(String.valueOf(image.getProductId())).resolve(image.getFileName()).normalize();
    if (!filePath.startsWith(root)) {
      throw new BusinessException("Đường dẫn ảnh không hợp lệ.");
    }
    if (!Files.exists(filePath)) {
      throw new ResourceNotFoundException("Tệp ảnh không tồn tại: " + image.getFileName());
    }

    try {
      Resource resource = new UrlResource(filePath.toUri());
      if (!resource.exists() || !resource.isReadable()) {
        throw new ResourceNotFoundException("Không đọc được tệp ảnh: " + image.getFileName());
      }
      return new ProductImageFile(resource, image.getContentType(), image.getFileName());
    } catch (IOException ex) {
      throw new BusinessException("Không tải được ảnh sản phẩm.");
    }
  }

  @Transactional
  public ProductResponse updateProduct(
      Long productId, ProductUpdateRequest req, JwtAuthenticatedPrincipal principal) {
    Product p =
        productRepository
            .findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));
    storeAccessService.assertCanAccessStore(p.getStoreId(), principal);
    validateProductFks(req.categoryId(), req.brandId(), req.unitId());

    long storeId = p.getStoreId();
    String newCode = req.productCode().trim();
    if (!newCode.equals(p.getProductCode())
        && productRepository.existsByProductCodeAndStoreIdAndIdNot(newCode, storeId, productId)) {
      throw new BusinessException("Mã sản phẩm đã tồn tại trong cửa hàng: " + newCode);
    }

    Set<String> skusInRequest = new HashSet<>();
    Set<Long> requestedVariantIds =
        req.variants().stream()
            .map(ProductVariantUpsertRequest::id)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    List<ProductVariant> current = variantRepository.findByProductId(productId);
    Set<Long> existingIds = current.stream().map(ProductVariant::getId).collect(Collectors.toSet());
    for (Long rid : requestedVariantIds) {
      if (!existingIds.contains(rid)) {
        throw new BusinessException("Biến thể không thuộc sản phẩm: " + rid);
      }
    }

    for (ProductVariantUpsertRequest v : req.variants()) {
      String sku = v.sku().trim();
      if (!skusInRequest.add(sku)) {
        throw new BusinessException("Trùng SKU trong cùng yêu cầu: " + sku);
      }
      if (v.id() != null) {
        if (variantRepository.existsBySkuInStoreExcludingVariant(sku, storeId, v.id())) {
          throw new BusinessException("SKU đã tồn tại trong cửa hàng: " + sku);
        }
      }
    }

    Set<Long> orphanIds =
        current.stream()
            .map(ProductVariant::getId)
            .filter(id -> !requestedVariantIds.contains(id))
            .collect(Collectors.toSet());

    for (Long oid : orphanIds) {
      if (variantRepository.countReferencesByVariantId(oid) > 0) {
        ProductVariant ov =
            variantRepository
                .findById(oid)
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại: " + oid));
        throw new BusinessException(
            "Không xóa được biến thể SKU "
                + ov.getSku()
                + ": đã có trên đơn hàng, phiếu kho hoặc tồn kho.");
      }
    }

    for (Long oid : orphanIds) {
      variantRepository.deleteById(oid);
    }
    variantRepository.flush();

    for (ProductVariantUpsertRequest v : req.variants()) {
      if (v.id() == null) {
        String sku = v.sku().trim();
        if (variantRepository.existsBySkuAndProductStoreId(sku, storeId)) {
          throw new BusinessException("SKU đã tồn tại trong cửa hàng: " + sku);
        }
      }
    }

    LocalDateTime t = now();
    p.setCategoryId(req.categoryId());
    p.setBrandId(req.brandId());
    p.setUnitId(req.unitId());
    p.setProductCode(newCode);
    p.setProductName(req.productName().trim());
    p.setProductType(normalizeProductType(req.productType()));
    p.setHasVariant(req.hasVariant());
    p.setTrackInventory(req.trackInventory());
    p.setDescription(req.description());
    p.setStatus(normalizeActiveInactiveStatus(req.status()));
    p.setUpdatedAt(t);
    productRepository.save(p);

    for (ProductVariantUpsertRequest vr : req.variants()) {
      if (vr.id() == null) {
        ProductVariant pv = new ProductVariant();
        pv.setProductId(productId);
        pv.setSku(vr.sku().trim());
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
      } else {
        ProductVariant pv =
            variantRepository
                .findById(vr.id())
                .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + vr.id()));
        if (!pv.getProductId().equals(productId)) {
          throw new BusinessException("Biến thể không thuộc sản phẩm: " + vr.id());
        }
        pv.setSku(vr.sku().trim());
        pv.setBarcode(vr.barcode());
        pv.setVariantName(vr.variantName());
        pv.setAttributesJson(vr.attributesJson());
        pv.setCostPrice(vr.costPrice());
        pv.setSellingPrice(vr.sellingPrice());
        pv.setReorderLevel(vr.reorderLevel());
        pv.setStatus(normalizeActiveInactiveStatus(vr.status()));
        pv.setUpdatedAt(t);
        variantRepository.save(pv);
      }
    }

    return getProduct(productId, principal);
  }

  private void validateProductFks(Long categoryId, Long brandId, Long unitId) {
    if (categoryId != null && !categoryRepository.existsById(categoryId)) {
      throw new BusinessException("Danh mục không tồn tại: " + categoryId);
    }
    if (brandId != null && !brandRepository.existsById(brandId)) {
      throw new BusinessException("Thương hiệu không tồn tại: " + brandId);
    }
    if (unitId != null && !unitRepository.existsById(unitId)) {
      throw new BusinessException("Đơn vị tính không tồn tại: " + unitId);
    }
  }

  private List<ProductImageResponse> saveProductImages(
      Product product, List<MultipartFile> images, LocalDateTime createdAt) {
    if (images == null || images.isEmpty()) {
      return List.of();
    }

    List<MultipartFile> validImages =
        images.stream().filter(Objects::nonNull).filter(f -> !f.isEmpty()).toList();
    if (validImages.isEmpty()) {
      return List.of();
    }
    if (validImages.size() > MAX_IMAGES_PER_PRODUCT) {
      throw new BusinessException("Tối đa " + MAX_IMAGES_PER_PRODUCT + " ảnh cho một sản phẩm.");
    }

    Path root = Path.of(productImagesDir).toAbsolutePath().normalize();
    Path productDir = root.resolve(String.valueOf(product.getId())).normalize();
    if (!productDir.startsWith(root)) {
      throw new BusinessException("Đường dẫn lưu ảnh không hợp lệ.");
    }

    try {
      Files.createDirectories(productDir);
    } catch (IOException ex) {
      throw new BusinessException("Không thể tạo thư mục lưu ảnh sản phẩm.");
    }

    List<ProductImageResponse> saved = new ArrayList<>();
    int index = 0;
    for (MultipartFile file : validImages) {
      String contentType = file.getContentType();
      if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
        throw new BusinessException("Tệp không hợp lệ, chỉ chấp nhận ảnh.");
      }
      if (file.getSize() > MAX_IMAGE_BYTES) {
        throw new BusinessException("Mỗi ảnh không được vượt quá 2MB.");
      }

      String ext = guessExtension(file.getOriginalFilename(), contentType);
      String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
      Path target = productDir.resolve(storedName).normalize();
      if (!target.startsWith(productDir)) {
        throw new BusinessException("Tên tệp ảnh không hợp lệ.");
      }

      try (InputStream in = file.getInputStream()) {
        Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
      } catch (IOException ex) {
        throw new BusinessException("Không thể lưu ảnh sản phẩm.");
      }

      ProductImage row = new ProductImage();
      row.setProductId(product.getId());
      row.setSortOrder(index);
      row.setContentType(contentType);
      row.setFileName(storedName);
      row.setCreatedAt(createdAt);
      productImageRepository.save(row);
      saved.add(toImageResponse(row));
      index++;
    }
    return saved;
  }

  private static String guessExtension(String originalName, String contentType) {
    if (originalName != null) {
      int dot = originalName.lastIndexOf('.');
      if (dot >= 0 && dot < originalName.length() - 1) {
        String ext = originalName.substring(dot).trim().toLowerCase(Locale.ROOT);
        if (ext.length() <= 10) {
          return ext;
        }
      }
    }
    if ("image/jpeg".equalsIgnoreCase(contentType)) return ".jpg";
    if ("image/png".equalsIgnoreCase(contentType)) return ".png";
    if ("image/webp".equalsIgnoreCase(contentType)) return ".webp";
    if ("image/gif".equalsIgnoreCase(contentType)) return ".gif";
    return ".img";
  }

  private ProductResponse toProductResponse(
      Product p, List<ProductVariantResponse> variants, List<ProductImageResponse> images) {
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
          variants,
          images);
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

  private ProductImageResponse toImageResponse(ProductImage i) {
    return new ProductImageResponse(
        i.getId(),
        i.getSortOrder(),
        i.getContentType(),
        i.getFileName(),
        "/api/products/images/" + i.getId() + "/file",
        i.getCreatedAt());
  }
}
