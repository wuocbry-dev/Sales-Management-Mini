package com.quanlybanhang.controller;

import com.quanlybanhang.dto.UserDtos.AssignBranchesRequest;
import com.quanlybanhang.dto.UserDtos.UserDetailResponse;
import com.quanlybanhang.dto.UserDtos.UserResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Người dùng theo phạm vi cửa hàng: STORE_MANAGER (USER_VIEW / USER_ASSIGN_BRANCH) không dùng
 * {@code /api/users} (chỉ {@code @authz.systemManage}).
 */
@RestController
@RequestMapping("/api/stores/{storeId}/users")
@RequiredArgsConstructor
public class StoreScopedUserController {

  private final UserService userService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('USER_VIEW')")
  public Page<UserResponse> list(
      @PathVariable Long storeId,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.listUsersForStore(storeId, pageable, principal);
  }

  @PutMapping("/{userId}/branches")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('USER_ASSIGN_BRANCH')")
  public UserDetailResponse assignBranches(
      @PathVariable Long storeId,
      @PathVariable Long userId,
      @Valid @RequestBody AssignBranchesRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return userService.assignBranchesForStore(storeId, userId, req, principal);
  }
}
