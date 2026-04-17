package com.quanlybanhang.controller;

import com.quanlybanhang.dto.ProductDtos.ProductCreateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductResponse;
import com.quanlybanhang.dto.ProductDtos.ProductUpdateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductVariantOptionResponse;
import com.quanlybanhang.service.ProductService.ProductImageFile;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

  private final ProductService productService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_VIEW')")
  public Page<ProductResponse> list(
      Pageable pageable,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(required = false) Long brandId,
      @RequestParam(required = false) String q,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.listProducts(pageable, status, categoryId, brandId, q, principal);
  }

  @GetMapping("/variant-search")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'PRODUCT_VIEW', 'GOODS_RECEIPT_CREATE', 'GOODS_RECEIPT_CONFIRM')")
  public List<ProductVariantOptionResponse> variantSearch(
      @RequestParam long storeId,
      @RequestParam(required = false) String q,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.searchVariantOptions(storeId, q, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_VIEW')")
  public ProductResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.getProduct(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_CREATE')")
  public ProductResponse create(
      @Valid @RequestBody ProductCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.createProduct(req, principal);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_CREATE')")
  public ProductResponse createWithImages(
      @Valid @RequestPart("payload") ProductCreateRequest req,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.createProduct(req, images == null ? List.of() : images, principal);
  }

  @GetMapping("/images/{imageId}/file")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_VIEW')")
  public ResponseEntity<org.springframework.core.io.Resource> imageFile(
      @PathVariable Long imageId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    ProductImageFile file = productService.loadProductImageFile(imageId, principal);
    MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
    try {
      if (file.contentType() != null && !file.contentType().isBlank()) {
        mediaType = MediaType.parseMediaType(file.contentType());
      }
    } catch (IllegalArgumentException ignored) {
      mediaType = MediaType.APPLICATION_OCTET_STREAM;
    }

    return ResponseEntity.ok()
        .contentType(mediaType)
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.fileName() + "\"")
        .body(file.resource());
  }

  @PutMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public ProductResponse update(
      @PathVariable Long id,
      @Valid @RequestBody ProductUpdateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.updateProduct(id, req, principal);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public void delete(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    productService.deleteProduct(id, principal);
  }
}
