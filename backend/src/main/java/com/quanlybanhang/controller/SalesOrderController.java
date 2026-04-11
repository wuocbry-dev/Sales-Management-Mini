package com.quanlybanhang.controller;

import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderConfirmRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderCreateRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.SalesOrderService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

  private final SalesOrderService salesOrderService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('ORDER_VIEW')")
  public Page<SalesOrderResponse> list(
      Pageable pageable, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesOrderService.list(pageable, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('ORDER_VIEW')")
  public SalesOrderResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesOrderService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('ORDER_CREATE')")
  public SalesOrderResponse create(
      @Valid @RequestBody SalesOrderCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesOrderService.createDraft(
        req, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/confirm")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('ORDER_CONFIRM')")
  public SalesOrderResponse confirm(
      @PathVariable Long id,
      @Valid @RequestBody SalesOrderConfirmRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesOrderService.confirm(
        id, req, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('ORDER_CANCEL')")
  public SalesOrderResponse cancel(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesOrderService.cancel(id, principal);
  }
}
