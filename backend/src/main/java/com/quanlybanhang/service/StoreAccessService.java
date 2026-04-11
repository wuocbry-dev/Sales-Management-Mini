package com.quanlybanhang.service;

import com.quanlybanhang.model.Branch;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Kiểm tra user (JWT) có được thao tác trên {@code storeId} hay không: SYSTEM_ADMIN / ADMIN
 * mọi cửa hàng; user khác chỉ các store trong {@link JwtAuthenticatedPrincipal#storeIds()}
 * (đã gộp store từ chi nhánh được gán).
 *
 * <p>Chi nhánh: ưu tiên kiểm tra {@code branch.storeId} thuộc {@code principal.storeIds()}
 * (store trước, branch sau); thêm trường hợp user chỉ được gán branch (branchIds) nhưng store
 * đã được suy ra vào storeIds tại login.
 */
@Service
public class StoreAccessService {

  private final BranchRepository branchRepository;

  public StoreAccessService(BranchRepository branchRepository) {
    this.branchRepository = branchRepository;
  }

  /**
   * User chỉ vận hành theo chi nhánh được gán: {@code ROLE_BRANCH_MANAGER}, {@code ROLE_CASHIER} hoặc
   * {@code ROLE_WAREHOUSE_STAFF}, có {@code branchIds}, không phải quản trị hệ thống, không có
   * {@code ROLE_STORE_MANAGER}. Store được phép = chỉ các store suy từ chi nhánh đã gán (không mở
   * rộng theo {@code user_stores}).
   */
  public boolean isBranchOnlyScoped(JwtAuthenticatedPrincipal principal) {
    if (principal == null || principal.branchIds().isEmpty()) {
      return false;
    }
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && isFullSystemAccess(auth)) {
      return false;
    }
    if (hasRole(auth, "STORE_MANAGER")) {
      return false;
    }
    return hasRole(auth, "BRANCH_MANAGER")
        || hasRole(auth, "CASHIER")
        || hasRole(auth, "WAREHOUSE_STAFF");
  }

  /** Các {@code store_id} suy ra từ {@link JwtAuthenticatedPrincipal#branchIds()} (ổn định). */
  public List<Long> storeIdsFromAssignedBranches(JwtAuthenticatedPrincipal principal) {
    Set<Long> out = new LinkedHashSet<>();
    for (Long bid : principal.branchIds()) {
      branchRepository.findById(bid).ifPresent(b -> out.add(b.getStoreId()));
    }
    return new ArrayList<>(out);
  }

  /** @return {@code true} nếu được phép thao tác trên {@code storeId} (không ném). */
  public boolean canAccessStore(long storeId, JwtAuthenticatedPrincipal principal) {
    if (principal == null) {
      return false;
    }
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && isFullSystemAccess(auth)) {
      return true;
    }
    if (isBranchOnlyScoped(principal)) {
      return storeIdsFromAssignedBranches(principal).contains(storeId);
    }
    return principal.storeIds().contains(storeId);
  }

  public void assertCanAccessStore(long storeId, JwtAuthenticatedPrincipal principal) {
    if (!canAccessStore(storeId, principal)) {
      if (principal == null) {
        throw new AccessDeniedException("Chưa đăng nhập.");
      }
      throw new AccessDeniedException("Không có quyền thao tác trên cửa hàng này.");
    }
  }

  /**
   * Cho phép nếu chi nhánh thuộc một store mà user được phép, hoặc user được gán trực tiếp
   * branch đó (JWT branchIds).
   */
  public void assertCanAccessBranch(long branchId, JwtAuthenticatedPrincipal principal) {
    if (principal == null) {
      throw new AccessDeniedException("Chưa đăng nhập.");
    }
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && isFullSystemAccess(auth)) {
      return;
    }
    Branch b =
        branchRepository
            .findById(branchId)
            .orElseThrow(() -> new AccessDeniedException("Không tìm thấy chi nhánh."));
    if (isBranchOnlyScoped(principal)) {
      if (!principal.branchIds().contains(branchId)) {
        throw new AccessDeniedException("Không có quyền thao tác trên chi nhánh này.");
      }
      return;
    }
    if (principal.storeIds().contains(b.getStoreId())) {
      return;
    }
    if (principal.branchIds().contains(branchId)) {
      return;
    }
    throw new AccessDeniedException("Không có quyền thao tác trên chi nhánh này.");
  }

  /** SYSTEM_ADMIN / ADMIN: xem toàn hệ thống. */
  public boolean isFullSystemAccess() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null && isFullSystemAccess(auth);
  }

  /**
   * Bộ lọc store cho truy vấn dữ liệu (đơn, kho, báo cáo…): {@code null} = không giới hạn
   * (quản trị); danh sách non-empty = chỉ các store đó; rỗng với user không quản trị → không
   * được xem dữ liệu store-scoped (chặn rò rỉ).
   */
  public List<Long> dataStoreScopeOrDeny(JwtAuthenticatedPrincipal principal) {
    if (principal == null) {
      throw new AccessDeniedException("Chưa đăng nhập.");
    }
    if (isFullSystemAccess()) {
      return null;
    }
    if (isBranchOnlyScoped(principal)) {
      List<Long> fromBranches = storeIdsFromAssignedBranches(principal);
      if (fromBranches.isEmpty()) {
        throw new AccessDeniedException("Chưa được gán chi nhánh.");
      }
      return fromBranches;
    }
    if (principal.storeIds().isEmpty()) {
      throw new AccessDeniedException("Chưa được gán cửa hàng.");
    }
    return principal.storeIds();
  }

  /**
   * Phạm vi chi nhánh cho lọc API: {@code null} = không lọc theo branch (quản trị / store
   * manager…); danh sách non-empty = chỉ các {@code branch_id} đó.
   */
  public List<Long> dataBranchScopeOrDeny(JwtAuthenticatedPrincipal principal) {
    if (principal == null) {
      throw new AccessDeniedException("Chưa đăng nhập.");
    }
    if (isFullSystemAccess()) {
      return null;
    }
    if (isBranchOnlyScoped(principal)) {
      if (principal.branchIds().isEmpty()) {
        throw new AccessDeniedException("Chưa được gán chi nhánh.");
      }
      return principal.branchIds();
    }
    return null;
  }

  private static boolean hasRole(Authentication auth, String roleCode) {
    if (auth == null) {
      return false;
    }
    String want = "ROLE_" + roleCode;
    for (GrantedAuthority a : auth.getAuthorities()) {
      if (want.equals(a.getAuthority())) {
        return true;
      }
    }
    return false;
  }

  private static boolean isFullSystemAccess(Authentication auth) {
    for (GrantedAuthority a : auth.getAuthorities()) {
      String k = a.getAuthority();
      if ("ROLE_SYSTEM_ADMIN".equals(k) || "ROLE_ADMIN".equals(k)) {
        return true;
      }
    }
    return false;
  }
}
