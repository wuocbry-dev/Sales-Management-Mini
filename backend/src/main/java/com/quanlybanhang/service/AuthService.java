package com.quanlybanhang.service;

import com.quanlybanhang.dto.AuthDtos.AuthResponse;
import com.quanlybanhang.dto.AuthDtos.AuthUserInfo;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.AuthDtos.MeResponse;
import com.quanlybanhang.dto.AuthDtos.RegisterRequest;
import com.quanlybanhang.exception.AuthApiException;
import com.quanlybanhang.exception.AuthErrorCodes;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.security.CustomUserDetailsService;
import com.quanlybanhang.security.CustomUserPrincipal;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.security.JwtService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private static final String ROLE_FIRST_USER = "ADMIN";

  private final AppUserRepository appUserRepository;
  private final RoleRepository roleRepository;
  private final UserRoleAssignmentRepository userRoleAssignmentRepository;
  private final CustomUserDetailsService customUserDetailsService;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Value("${app.jwt.expiration-ms:86400000}")
  private long expirationMs;

  @Value("${app.auth.register-default-role:CASHIER}")
  private String registerDefaultRoleCode;

  @Transactional
  public AuthResponse register(RegisterRequest req) {
    String username = req.username().trim();
    if (appUserRepository.existsByUsername(username)) {
      throw new AuthApiException(
          HttpStatus.CONFLICT,
          AuthErrorCodes.USERNAME_ALREADY_EXISTS,
          "Tên đăng nhập đã được sử dụng.");
    }
    String email = req.email().trim();
    if (appUserRepository.existsByEmailIgnoreCase(email)) {
      throw new AuthApiException(
          HttpStatus.CONFLICT, AuthErrorCodes.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng.");
    }

    long userCountBefore = appUserRepository.count();
    LocalDateTime t = LocalDateTime.now();
    AppUser user = new AppUser();
    user.setUsername(username);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(req.password()));
    user.setFullName(req.fullName().trim());
    if (req.phone() != null && !req.phone().isBlank()) {
      user.setPhone(req.phone().trim());
    }
    user.setStatus(DomainConstants.STATUS_ACTIVE);
    user.setDefaultStore(null);
    user.setCreatedAt(t);
    user.setUpdatedAt(t);
    appUserRepository.save(user);

    String roleCode = userCountBefore == 0 ? ROLE_FIRST_USER : registerDefaultRoleCode.trim();
    Role role =
        roleRepository
            .findByRoleCode(roleCode)
            .orElseThrow(
                () ->
                    new BusinessException(
                        "Chưa cấu hình role trong hệ thống (role_code=" + roleCode + ")."));

    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(user.getId(), role.getId()));
    userRoleAssignmentRepository.save(link);

    return buildAuthResponse(user, user.getUsername());
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest req) {
    String loginKey = req.username().trim();
    AppUser user =
        appUserRepository
            .findByUsernameOrEmail(loginKey)
            .orElseThrow(() -> new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu"));

    assertAccountAllowedForLogin(user);

    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu");
    }

    return buildAuthResponse(user, loginKey);
  }

  @Transactional(readOnly = true)
  public MeResponse me() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new AuthApiException(
          HttpStatus.UNAUTHORIZED, AuthErrorCodes.UNAUTHORIZED, "Chưa đăng nhập.");
    }
    Object p = auth.getPrincipal();
    if (!(p instanceof JwtAuthenticatedPrincipal jp)) {
      throw new AuthApiException(
          HttpStatus.UNAUTHORIZED, AuthErrorCodes.UNAUTHORIZED, "Chưa đăng nhập.");
    }

    AppUser user =
        appUserRepository
            .findById(jp.userId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

    List<String> roles = new ArrayList<>();
    List<String> permissions = new ArrayList<>();
    for (GrantedAuthority a : auth.getAuthorities()) {
      String key = a.getAuthority();
      if (key.startsWith("ROLE_")) {
        roles.add(key.substring(5));
      } else {
        permissions.add(key);
      }
    }

    Long defaultStoreId =
        user.getDefaultStore() != null ? user.getDefaultStore().getId() : null;

    return new MeResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getFullName(),
        user.getPhone(),
        user.getStatus(),
        List.copyOf(roles),
        List.copyOf(permissions),
        jp.storeIds(),
        defaultStoreId);
  }

  private void assertAccountAllowedForLogin(AppUser user) {
    String st = user.getStatus() == null ? "" : user.getStatus().trim();
    if (st.equalsIgnoreCase("LOCKED") || st.equalsIgnoreCase(DomainConstants.STATUS_LOCKED)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN, AuthErrorCodes.ACCOUNT_LOCKED, "Tài khoản đã bị khóa.");
    }
    if (st.equalsIgnoreCase("INACTIVE") || st.equalsIgnoreCase(DomainConstants.STATUS_INACTIVE)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.ACCOUNT_INACTIVE,
          "Tài khoản không hoạt động (inactive).");
    }
    if (!st.equalsIgnoreCase("ACTIVE") && !st.equalsIgnoreCase(DomainConstants.STATUS_ACTIVE)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN, AuthErrorCodes.ACCOUNT_INACTIVE, "Tài khoản không hoạt động.");
    }
  }

  private AuthResponse buildAuthResponse(AppUser user, String loadUserDetailsKey) {
    UserDetails ud = customUserDetailsService.loadUserByUsername(loadUserDetailsKey);
    if (!(ud instanceof CustomUserPrincipal principal)) {
      throw new IllegalStateException("Không tải được thông tin đăng nhập.");
    }

    List<String> roleCodes = new ArrayList<>();
    List<String> permissionCodes = new ArrayList<>();
    for (GrantedAuthority a : ud.getAuthorities()) {
      String key = a.getAuthority();
      if (key.startsWith("ROLE_")) {
        roleCodes.add(key.substring(5));
      } else {
        permissionCodes.add(key);
      }
    }

    String token =
        jwtService.generateToken(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            roleCodes,
            permissionCodes,
            principal.getAssignedStoreIds());

    AuthUserInfo userInfo =
        new AuthUserInfo(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getStatus());

    return new AuthResponse(
        token,
        "Bearer",
        expirationMs / 1000,
        userInfo,
        List.copyOf(roleCodes),
        List.copyOf(permissionCodes));
  }
}
