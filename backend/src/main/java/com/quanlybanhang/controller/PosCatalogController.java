package com.quanlybanhang.controller;

import com.quanlybanhang.dto.ProductDtos.ProductVariantOptionResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.ProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class PosCatalogController {

  private final ProductService productService;

  @GetMapping("/variants/search")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'ORDER_CREATE', 'ORDER_VIEW', 'PRODUCT_VIEW')")
  public List<ProductVariantOptionResponse> searchVariants(
      @RequestParam long storeId,
      @RequestParam(required = false) String q,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.searchVariantOptions(storeId, q, principal);
  }

  @GetMapping("/variants/by-barcode")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'ORDER_CREATE', 'ORDER_VIEW', 'PRODUCT_VIEW')")
  public ProductVariantOptionResponse variantByBarcode(
      @RequestParam long storeId,
      @RequestParam String barcode,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return productService.searchVariantByBarcode(storeId, barcode, principal);
  }
}
