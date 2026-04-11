package com.quanlybanhang.security;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Principal đọc từ bảng {@code users} + role/permission/store/branch. Dùng với {@link
 * CustomUserDetailsService} (và sau này có thể gắn với {@code AuthenticationManager}).
 */
public final class CustomUserPrincipal implements UserDetails {

  private final long userId;
  private final String username;
  private final String passwordHash;
  private final Collection<? extends GrantedAuthority> authorities;
  private final boolean enabled;
  private final boolean accountNonLocked;
  private final List<Long> assignedStoreIds;
  private final List<Long> assignedBranchIds;
  private final Long defaultStoreId;

  public CustomUserPrincipal(
      long userId,
      String username,
      String passwordHash,
      Collection<? extends GrantedAuthority> authorities,
      boolean enabled,
      boolean accountNonLocked,
      List<Long> assignedStoreIds,
      List<Long> assignedBranchIds,
      Long defaultStoreId) {
    this.userId = userId;
    this.username = username;
    this.passwordHash = passwordHash;
    this.authorities = List.copyOf(authorities);
    this.enabled = enabled;
    this.accountNonLocked = accountNonLocked;
    this.assignedStoreIds = List.copyOf(assignedStoreIds);
    this.assignedBranchIds = List.copyOf(assignedBranchIds);
    this.defaultStoreId = defaultStoreId;
  }

  public long getUserId() {
    return userId;
  }

  public List<Long> getAssignedStoreIds() {
    return assignedStoreIds;
  }

  public List<Long> getAssignedBranchIds() {
    return assignedBranchIds;
  }

  public Long getDefaultStoreId() {
    return defaultStoreId;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return passwordHash;
  }

  @Override
  public String getUsername() {
    return username;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return accountNonLocked;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return enabled;
  }
}
