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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
  public Page<BrandResponse> listBrands(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.listBrands(pageable, storeId, principal);
  }

  @GetMapping("/brands/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public BrandResponse getBrand(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.getBrand(id, principal);
  }

  @PostMapping("/brands")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public BrandResponse createBrand(
      @Valid @RequestBody BrandRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.createBrand(req, principal);
  }

  @PutMapping("/brands/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public BrandResponse updateBrand(
      @PathVariable Long id,
      @Valid @RequestBody BrandRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.updateBrand(id, req, principal);
  }

  @DeleteMapping("/brands/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public void deleteBrand(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    masterDataService.deleteBrand(id, principal);
  }

  @GetMapping("/categories")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<CategoryResponse> listCategories(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.listCategories(pageable, storeId, principal);
  }

  @GetMapping("/categories/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public CategoryResponse getCategory(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.getCategory(id, principal);
  }

  @PostMapping("/categories")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public CategoryResponse createCategory(
      @Valid @RequestBody CategoryRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.createCategory(req, principal);
  }

  @PutMapping("/categories/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public CategoryResponse updateCategory(
      @PathVariable Long id,
      @Valid @RequestBody CategoryRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.updateCategory(id, req, principal);
  }

  @DeleteMapping("/categories/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public void deleteCategory(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    masterDataService.deleteCategory(id, principal);
  }

  @GetMapping("/units")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<UnitResponse> listUnits(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.listUnits(pageable, storeId, principal);
  }

  @GetMapping("/units/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public UnitResponse getUnit(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.getUnit(id, principal);
  }

  @PostMapping("/units")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public UnitResponse createUnit(
      @Valid @RequestBody UnitRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.createUnit(req, principal);
  }

  @PutMapping("/units/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public UnitResponse updateUnit(
      @PathVariable Long id,
      @Valid @RequestBody UnitRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.updateUnit(id, req, principal);
  }

  @DeleteMapping("/units/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PRODUCT_UPDATE')")
  public void deleteUnit(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    masterDataService.deleteUnit(id, principal);
  }

  @GetMapping("/suppliers")
  @PreAuthorize("@authz.masterRead(authentication)")
  public Page<SupplierResponse> listSuppliers(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.listSuppliers(pageable, storeId, principal);
  }

  @GetMapping("/suppliers/{id}")
  @PreAuthorize("@authz.masterRead(authentication)")
  public SupplierResponse getSupplier(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.getSupplier(id, principal);
  }

  @PostMapping("/suppliers")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'GOODS_RECEIPT_CREATE', 'PRODUCT_UPDATE')")
  public SupplierResponse createSupplier(
      @Valid @RequestBody SupplierRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.createSupplier(req, principal);
  }

  @PutMapping("/suppliers/{id}")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'GOODS_RECEIPT_CREATE', 'PRODUCT_UPDATE')")
  public SupplierResponse updateSupplier(
      @PathVariable Long id,
      @Valid @RequestBody SupplierRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return masterDataService.updateSupplier(id, req, principal);
  }

  @DeleteMapping("/suppliers/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'GOODS_RECEIPT_CREATE', 'PRODUCT_UPDATE')")
  public void deleteSupplier(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    masterDataService.deleteSupplier(id, principal);
  }
}
