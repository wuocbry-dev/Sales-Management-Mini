package com.quanlybanhang.security;

import com.quanlybanhang.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Lấy {@code user_id} từ JWT trong {@link SecurityContextHolder}. */
public final class CurrentUserResolver {

  private CurrentUserResolver() {}

  public static long requireUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new BusinessException("Chưa đăng nhập.");
    }
    Object p = auth.getPrincipal();
    if (p instanceof JwtAuthenticatedPrincipal j) {
      return j.userId();
    }
    if (p instanceof String s) {
      if ("anonymousUser".equals(s)) {
        throw new BusinessException("Chưa đăng nhập.");
      }
      try {
        return Long.parseLong(s);
      } catch (NumberFormatException ignored) {
        // fall through
      }
    }
    throw new BusinessException("Không xác định được người dùng.");
  }
}
