package com.quanlybanhang.service;

import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Kiểm tra user (JWT) có được thao tác trên {@code storeId} hay không: {@code ROLE_ADMIN}
 * mọi cửa hàng; user khác chỉ các store trong {@link JwtAuthenticatedPrincipal#storeIds()}.
 */
@Service
public class StoreAccessService {

  private static final String ROLE_ADMIN = "ROLE_ADMIN";

  public void assertCanAccessStore(long storeId, JwtAuthenticatedPrincipal principal) {
    if (principal == null) {
      throw new AccessDeniedException("Chưa đăng nhập.");
    }
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && isAdmin(auth)) {
      return;
    }
    if (principal.storeIds().contains(storeId)) {
      return;
    }
    throw new AccessDeniedException("Không có quyền thao tác trên cửa hàng này.");
  }

  private static boolean isAdmin(Authentication auth) {
    for (GrantedAuthority a : auth.getAuthorities()) {
      if (ROLE_ADMIN.equals(a.getAuthority())) {
        return true;
      }
    }
    return false;
  }
}
