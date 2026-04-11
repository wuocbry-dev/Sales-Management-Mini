package com.quanlybanhang.controller;

import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnCreateRequest;
import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.SalesReturnService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-returns")
@RequiredArgsConstructor
public class SalesReturnController {

  private final SalesReturnService salesReturnService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('RETURN_VIEW')")
  public Page<SalesReturnResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) Long orderId,
      @RequestParam(required = false) String status,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesReturnService.list(pageable, storeId, orderId, status, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('RETURN_VIEW')")
  public SalesReturnResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesReturnService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('RETURN_CREATE')")
  public SalesReturnResponse create(
      @Valid @RequestBody SalesReturnCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesReturnService.createDraft(
        req, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/confirm")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('RETURN_CREATE')")
  public SalesReturnResponse confirm(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return salesReturnService.confirm(id, CurrentUserResolver.requireUserId(), principal);
  }
}
