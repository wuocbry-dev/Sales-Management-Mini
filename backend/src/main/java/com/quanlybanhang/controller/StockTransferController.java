package com.quanlybanhang.controller;

import com.quanlybanhang.dto.StockTransferDtos.StockTransferCreateRequest;
import com.quanlybanhang.dto.StockTransferDtos.StockTransferResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.StockTransferService;
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
@RequestMapping("/api/stock-transfers")
@RequiredArgsConstructor
public class StockTransferController {

  private final StockTransferService stockTransferService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('TRANSFER_VIEW')")
  public Page<StockTransferResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long fromWarehouseId,
      @RequestParam(required = false) Long toWarehouseId,
      @RequestParam(required = false) String status,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stockTransferService.list(pageable, fromWarehouseId, toWarehouseId, status, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('TRANSFER_VIEW')")
  public StockTransferResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stockTransferService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('TRANSFER_CREATE')")
  public StockTransferResponse create(
      @Valid @RequestBody StockTransferCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stockTransferService.createDraft(
        req, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/send")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('TRANSFER_SEND')")
  public StockTransferResponse send(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stockTransferService.send(id, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/receive")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('TRANSFER_RECEIVE')")
  public StockTransferResponse receive(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stockTransferService.receive(id, CurrentUserResolver.requireUserId(), principal);
  }
}

