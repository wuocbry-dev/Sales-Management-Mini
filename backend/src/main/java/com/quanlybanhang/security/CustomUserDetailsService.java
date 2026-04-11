package com.quanlybanhang.security;

import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.RolePermission;
import com.quanlybanhang.model.RolePermissionOverride;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.PermissionRepository;
import com.quanlybanhang.repository.RolePermissionOverrideRepository;
import com.quanlybanhang.repository.RolePermissionRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserBranchRepository;
import com.quanlybanhang.repository.UserRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Nạp {@link UserDetails} từ DB: đăng nhập theo username hoặc email, role + permission →
 * authorities, cửa hàng được gán (kèm store suy ra từ chi nhánh). Trạng thái: chỉ {@code
 * ACTIVE} dùng được; {@code LOCKED} / {@code INACTIVE} bị chặn qua {@link UserDetails}.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;
  private final UserRoleAssignmentRepository userRoleAssignmentRepository;
  private final UserStoreRepository userStoreRepository;
  private final UserBranchRepository userBranchRepository;
  private final BranchRepository branchRepository;
  private final RoleRepository roleRepository;
  private final RolePermissionRepository rolePermissionRepository;
  private final PermissionRepository permissionRepository;
  private final RolePermissionOverrideRepository rolePermissionOverrideRepository;

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String login) {
    if (login == null || login.isBlank()) {
      throw new UsernameNotFoundException("Không tìm thấy người dùng.");
    }
    String key = login.trim();
    AppUser user =
        userRepository
            .findByUsernameOrEmail(key)
            .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng."));

    AccountFlags flags = resolveAccountFlags(user.getStatus());
    Set<String> authorityKeys = new LinkedHashSet<>();
    Set<Long> roleIds = new LinkedHashSet<>();

    List<UserRoleAssignment> links = userRoleAssignmentRepository.findById_UserId(user.getId());
    for (UserRoleAssignment link : links) {
      Long roleId = link.getId().getRoleId();
      roleIds.add(roleId);
      roleRepository
          .findById(roleId)
          .map(Role::getRoleCode)
          .ifPresent(code -> authorityKeys.add("ROLE_" + code));
    }

    for (Long roleId : roleIds) {
      List<RolePermission> rps = rolePermissionRepository.findById_RoleId(roleId);
      for (RolePermission rp : rps) {
        Long permId = rp.getId().getPermissionId();
        permissionRepository
            .findById(permId)
            .map(p -> p.getPermissionCode())
            .ifPresent(authorityKeys::add);
      }
    }

    List<RolePermissionOverride> globalOverrides =
        roleIds.isEmpty()
            ? List.of()
            : rolePermissionOverrideRepository.findByRoleIdInAndStoreIdIsNullAndBranchIdIsNull(
                roleIds);
    for (RolePermissionOverride o : globalOverrides) {
      String code =
          permissionRepository
              .findById(o.getPermissionId())
              .map(p -> p.getPermissionCode())
              .orElse(null);
      if (code == null) {
        continue;
      }
      if ("DENY".equalsIgnoreCase(o.getOverrideType())) {
        authorityKeys.remove(code);
      } else if ("ALLOW".equalsIgnoreCase(o.getOverrideType())) {
        authorityKeys.add(code);
      }
    }

    List<SimpleGrantedAuthority> granted = new ArrayList<>();
    for (String k : authorityKeys) {
      granted.add(new SimpleGrantedAuthority(k));
    }

    List<Long> branchIds =
        userBranchRepository.findById_UserId(user.getId()).stream()
            .map(ub -> ub.getId().getBranchId())
            .distinct()
            .sorted()
            .toList();

    Set<Long> storeIdSet = new LinkedHashSet<>();
    for (var us : userStoreRepository.findById_UserId(user.getId())) {
      storeIdSet.add(us.getId().getStoreId());
    }
    for (Long bid : branchIds) {
      branchRepository.findById(bid).ifPresent(b -> storeIdSet.add(b.getStoreId()));
    }
    List<Long> storeIds = storeIdSet.stream().sorted().toList();

    Long defaultStoreId = user.getDefaultStore() != null ? user.getDefaultStore().getId() : null;

    return new CustomUserPrincipal(
        user.getId(),
        user.getUsername(),
        user.getPasswordHash(),
        granted,
        flags.enabled(),
        flags.accountNonLocked(),
        storeIds,
        branchIds,
        defaultStoreId);
  }

  private static AccountFlags resolveAccountFlags(String status) {
    if (status == null || status.isBlank()) {
      return new AccountFlags(true, true);
    }
    String s = status.trim();
    if (s.equalsIgnoreCase("LOCKED") || s.equalsIgnoreCase(DomainConstants.STATUS_LOCKED)) {
      return new AccountFlags(false, false);
    }
    if (s.equalsIgnoreCase("INACTIVE") || s.equalsIgnoreCase(DomainConstants.STATUS_INACTIVE)) {
      return new AccountFlags(false, true);
    }
    if (s.equalsIgnoreCase("ACTIVE") || s.equalsIgnoreCase(DomainConstants.STATUS_ACTIVE)) {
      return new AccountFlags(true, true);
    }
    return new AccountFlags(false, false);
  }

  private record AccountFlags(boolean enabled, boolean accountNonLocked) {}
}
