package com.quanlybanhang.security;

import java.util.Arrays;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * SpEL bean {@code @authz} cho {@link org.springframework.security.access.prepost.PreAuthorize},
 * tránh chuỗi hasAuthority quá dài trên master data dùng chung.
 */
@Component("authz")
public class AuthorizationExpressions {

  public boolean hasRole(Authentication authentication, String roleCode) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return false;
    }
    String want = "ROLE_" + roleCode;
    for (GrantedAuthority a : authentication.getAuthorities()) {
      if (want.equals(a.getAuthority())) {
        return true;
      }
    }
    return false;
  }

  /** SYSTEM_ADMIN hoặc ADMIN (legacy): toàn quyền hệ thống + mọi store/branch. */
  public boolean systemManage(Authentication authentication) {
    return hasRole(authentication, "SYSTEM_ADMIN") || hasRole(authentication, "ADMIN");
  }

  public boolean hasAnyAuthority(Authentication authentication, String... authorities) {
    if (authentication == null || !authentication.isAuthenticated() || authorities == null) {
      return false;
    }
    var set = Arrays.stream(authorities).filter(s -> s != null && !s.isBlank()).toList();
    if (set.isEmpty()) {
      return false;
    }
    for (GrantedAuthority a : authentication.getAuthorities()) {
      String k = a.getAuthority();
      if (k != null && set.contains(k)) {
        return true;
      }
    }
    return false;
  }

  /** Báo cáo: toàn store hoặc theo chi nhánh (BRANCH_MANAGER). */
  public boolean reportRead(Authentication authentication) {
    if (systemManage(authentication)) {
      return true;
    }
    return hasAnyAuthority(authentication, "REPORT_VIEW", "REPORT_VIEW_BRANCH");
  }

  /** Đọc dữ liệu danh mục dùng chung (cửa hàng, NCC, nhãn, …) — một trong các quyền nghiệp vụ. */
  public boolean masterRead(Authentication authentication) {
    if (systemManage(authentication)) {
      return true;
    }
    return hasAnyAuthority(
        authentication,
        "PRODUCT_VIEW",
        "INVENTORY_VIEW",
        "INVENTORY_TRANSACTION_VIEW",
        "GOODS_RECEIPT_VIEW",
        "GOODS_RECEIPT_CREATE",
        "ORDER_VIEW",
        "ORDER_CREATE",
        "STORE_VIEW");
  }
}
