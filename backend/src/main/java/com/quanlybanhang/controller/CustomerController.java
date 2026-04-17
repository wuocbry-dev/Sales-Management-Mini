package com.quanlybanhang.controller;

import com.quanlybanhang.dto.CustomerDtos.CustomerRequest;
import com.quanlybanhang.dto.CustomerDtos.CustomerResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

  private final CustomerService customerService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_VIEW')")
  public Page<CustomerResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return customerService.list(pageable, storeId, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_VIEW')")
  public CustomerResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return customerService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_CREATE')")
  public CustomerResponse create(
      @Valid @RequestBody CustomerRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return customerService.create(req, principal);
  }

  @PutMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_UPDATE')")
  public CustomerResponse update(
      @PathVariable Long id,
      @Valid @RequestBody CustomerRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return customerService.update(id, req, principal);
  }
}
