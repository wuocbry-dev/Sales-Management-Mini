package com.quanlybanhang.security;

import java.io.Serializable;
import java.util.List;

/**
 * Principal trong {@link SecurityContextHolder} sau khi xác thực JWT (stateless).
 *
 * @param userId id bảng {@code users}
 * @param username tên đăng nhập (không phải email)
 * @param fullName họ tên tại thời điểm cấp token
 * @param storeIds cửa hàng được gán ({@code user_stores})
 */
public record JwtAuthenticatedPrincipal(
    long userId, String username, String fullName, List<Long> storeIds)
    implements Serializable {

  public JwtAuthenticatedPrincipal {
    fullName = fullName != null ? fullName : "";
    storeIds = storeIds != null ? List.copyOf(storeIds) : List.of();
  }
}
