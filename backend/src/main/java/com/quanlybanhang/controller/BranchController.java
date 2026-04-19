package com.quanlybanhang.controller;

import com.quanlybanhang.dto.BranchDtos.BranchRequest;
import com.quanlybanhang.dto.BranchDtos.BranchResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.BranchService;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BranchController {

  private final BranchService branchService;

  @GetMapping("/stores/{storeId}/branches")
  @PreAuthorize("@authz.branchRead(authentication)")
  public Page<BranchResponse> list(
      @PathVariable Long storeId,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.list(storeId, pageable, principal);
  }

  @GetMapping("/stores/{storeId}/branches/{branchId}")
  @PreAuthorize("@authz.branchRead(authentication)")
  public BranchResponse get(
      @PathVariable Long storeId,
      @PathVariable Long branchId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.get(storeId, branchId, principal);
  }

  @PostMapping("/stores/{storeId}/branches")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('BRANCH_CREATE')")
  public BranchResponse create(
      @PathVariable Long storeId,
      @Valid @RequestBody BranchRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.create(storeId, req, principal);
  }

  @PutMapping("/stores/{storeId}/branches/{branchId}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('BRANCH_UPDATE')")
  public BranchResponse update(
      @PathVariable Long storeId,
      @PathVariable Long branchId,
      @Valid @RequestBody BranchRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.update(storeId, branchId, req, principal);
  }

  /** Alias theo query {@code storeId} — cùng logic với {@code /api/stores/{storeId}/branches}. */
  @GetMapping("/branches")
  @PreAuthorize("@authz.branchRead(authentication)")
  public Page<BranchResponse> listByQuery(
      @RequestParam Long storeId,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.list(storeId, pageable, principal);
  }

  @GetMapping("/branches/{branchId}")
  @PreAuthorize("@authz.branchRead(authentication)")
  public BranchResponse getById(
      @PathVariable Long branchId, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.getById(branchId, principal);
  }

  @PostMapping("/branches")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('BRANCH_CREATE')")
  public BranchResponse createByQuery(
      @RequestParam Long storeId,
      @Valid @RequestBody BranchRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.create(storeId, req, principal);
  }

  @PutMapping("/branches/{branchId}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('BRANCH_UPDATE')")
  public BranchResponse updateById(
      @PathVariable Long branchId,
      @Valid @RequestBody BranchRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return branchService.updateById(branchId, req, principal);
  }
}
