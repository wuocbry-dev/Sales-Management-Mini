package com.quanlybanhang.controller;

import com.quanlybanhang.dto.StocktakeDtos.StocktakeCreateRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.StocktakeService;
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
@RequestMapping("/api/stocktakes")
@RequiredArgsConstructor
public class StocktakeController {

  private final StocktakeService stocktakeService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STOCKTAKE_VIEW')")
  public Page<StocktakeResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) String status,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stocktakeService.list(pageable, storeId, status, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STOCKTAKE_VIEW')")
  public StocktakeResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stocktakeService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STOCKTAKE_CREATE')")
  public StocktakeResponse create(
      @Valid @RequestBody StocktakeCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stocktakeService.createDraft(
        req, CurrentUserResolver.requireUserId(), principal);
  }

  @PostMapping("/{id}/confirm")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('STOCKTAKE_CREATE')")
  public StocktakeResponse confirm(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return stocktakeService.confirm(id, CurrentUserResolver.requireUserId(), principal);
  }
}
