package com.quanlybanhang.controller;

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
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.MasterDataService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MasterDataController {

  private final MasterDataService masterDataService;

  @GetMapping("/stores")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<StoreResponse> listStores(
      Pageable pageable, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.listStores(pageable, principal);
  }

  @GetMapping("/stores/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public StoreResponse getStore(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.getStore(id, principal);
  }

  @PostMapping("/stores")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STORE_CREATE')")
  public StoreResponse createStore(@Valid @RequestBody StoreRequest req) {
    return masterDataService.createStore(req);
  }

  @PutMapping("/stores/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STORE_UPDATE')")
  public StoreResponse updateStore(@PathVariable Long id, @Valid @RequestBody StoreRequest req) {
    return masterDataService.updateStore(id, req);
  }

  @GetMapping("/brands")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<BrandResponse> listBrands(Pageable pageable) {
    return masterDataService.listBrands(pageable);
  }

  @GetMapping("/brands/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public BrandResponse getBrand(@PathVariable Long id) {
    return masterDataService.getBrand(id);
  }

  @PostMapping("/brands")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public BrandResponse createBrand(@Valid @RequestBody BrandRequest req) {
    return masterDataService.createBrand(req);
  }

  @PutMapping("/brands/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public BrandResponse updateBrand(@PathVariable Long id, @Valid @RequestBody BrandRequest req) {
    return masterDataService.updateBrand(id, req);
  }

  @GetMapping("/categories")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<CategoryResponse> listCategories(Pageable pageable) {
    return masterDataService.listCategories(pageable);
  }

  @GetMapping("/categories/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public CategoryResponse getCategory(@PathVariable Long id) {
    return masterDataService.getCategory(id);
  }

  @PostMapping("/categories")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest req) {
    return masterDataService.createCategory(req);
  }

  @PutMapping("/categories/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
    return masterDataService.updateCategory(id, req);
  }

  @GetMapping("/units")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<UnitResponse> listUnits(Pageable pageable) {
    return masterDataService.listUnits(pageable);
  }

  @GetMapping("/units/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public UnitResponse getUnit(@PathVariable Long id) {
    return masterDataService.getUnit(id);
  }

  @PostMapping("/units")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public UnitResponse createUnit(@Valid @RequestBody UnitRequest req) {
    return masterDataService.createUnit(req);
  }

  @PutMapping("/units/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public UnitResponse updateUnit(@PathVariable Long id, @Valid @RequestBody UnitRequest req) {
    return masterDataService.updateUnit(id, req);
  }

  @GetMapping("/suppliers")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<SupplierResponse> listSuppliers(Pageable pageable) {
    return masterDataService.listSuppliers(pageable);
  }

  @GetMapping("/suppliers/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public SupplierResponse getSupplier(@PathVariable Long id) {
    return masterDataService.getSupplier(id);
  }

  @PostMapping("/suppliers")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'GOODS_RECEIPT_CREATE', 'PRODUCT_UPDATE')")
  public SupplierResponse createSupplier(@Valid @RequestBody SupplierRequest req) {
    return masterDataService.createSupplier(req);
  }

  @PutMapping("/suppliers/{id}")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'GOODS_RECEIPT_CREATE', 'PRODUCT_UPDATE')")
  public SupplierResponse updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest req) {
    return masterDataService.updateSupplier(id, req);
  }
}
