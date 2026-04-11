package com.quanlybanhang.controller;

import com.quanlybanhang.dto.ProductDtos.ProductCreateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductResponse;
import com.quanlybanhang.dto.ProductDtos.ProductUpdateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductVariantOptionResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
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

  @PutMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public ProductResponse update(
      @PathVariable Long id,
      @Valid @RequestBody ProductUpdateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.updateProduct(id, req, principal);
  }
}
