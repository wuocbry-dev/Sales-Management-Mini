package com.quanlybanhang.security;

import java.io.Serializable;
import java.util.List;

/**
 * Principal trong {@link SecurityContextHolder} sau khi xác thực JWT (stateless).
 *
 * @param userId id bảng {@code users}
 * @param username tên đăng nhập (không phải email)
 * @param fullName họ tên tại thời điểm cấp token
 * @param storeIds cửa hàng được phép (user_stores + store của user_branches)
 * @param branchIds chi nhánh được gán ({@code user_branches})
 */
public record JwtAuthenticatedPrincipal(
    long userId,
    String username,
    String fullName,
    List<Long> storeIds,
    List<Long> branchIds)
    implements Serializable {

  public JwtAuthenticatedPrincipal {
    fullName = fullName != null ? fullName : "";
    storeIds = storeIds != null ? List.copyOf(storeIds) : List.of();
    branchIds = branchIds != null ? List.copyOf(branchIds) : List.of();
  }
}
