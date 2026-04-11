package com.quanlybanhang.controller;

import com.quanlybanhang.dto.UserDtos.ChangeStoreStaffBranchRequest;
import com.quanlybanhang.dto.UserDtos.ChangeStoreStaffBranchResponse;
import com.quanlybanhang.dto.UserDtos.CreateStoreStaffRequest;
import com.quanlybanhang.dto.UserDtos.StoreStaffResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.UserService;
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

/**
 * API nhân viên cửa hàng (CASHIER / WAREHOUSE_STAFF) — tách path khỏi {@code /api/users/{id}}
 * để tránh xung đột routing.
 */
@RestController
@RequestMapping("/api/users/store-staff")
@RequiredArgsConstructor
public class StoreStaffUserController {

  private final UserService userService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasRole('STORE_MANAGER')")
  public StoreStaffResponse create(
      @Valid @RequestBody CreateStoreStaffRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.createStoreStaff(req, principal);
  }

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasRole('STORE_MANAGER')")
  public Page<StoreStaffResponse> list(
      @RequestParam(required = false) String roleCode,
      @RequestParam(required = false) Long branchId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Long storeId,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.listStoreStaff(roleCode, branchId, status, storeId, pageable, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasRole('STORE_MANAGER')")
  public StoreStaffResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.getStoreStaff(id, principal);
  }

  @PutMapping("/{id}/change-branch")
  @PreAuthorize("@authz.systemManage(authentication) or hasRole('STORE_MANAGER')")
  public ChangeStoreStaffBranchResponse changeBranch(
      @PathVariable Long id,
      @Valid @RequestBody ChangeStoreStaffBranchRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.changeStoreStaffBranch(id, req, principal);
  }
}
