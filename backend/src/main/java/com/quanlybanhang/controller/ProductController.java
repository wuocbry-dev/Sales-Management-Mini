package com.quanlybanhang.controller;

import com.quanlybanhang.dto.ProductDtos.ProductCreateRequest;
import com.quanlybanhang.dto.ProductDtos.ProductResponse;
import com.quanlybanhang.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
      @RequestParam(required = false) String q) {
    return productService.listProducts(pageable, status, categoryId, brandId, q);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_VIEW')")
  public ProductResponse get(@PathVariable Long id) {
    return productService.getProduct(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_CREATE')")
  public ProductResponse create(@Valid @RequestBody ProductCreateRequest req) {
    return productService.createProduct(req);
  }
}
