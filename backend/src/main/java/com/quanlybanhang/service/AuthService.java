package com.quanlybanhang.service;

import com.quanlybanhang.dto.AuthDtos.AuthResponse;
import com.quanlybanhang.dto.AuthDtos.AuthUserInfo;
import com.quanlybanhang.dto.AuthDtos.ChangePasswordRequest;
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
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
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

  private final AppUserRepository appUserRepository;
  private final RoleRepository roleRepository;
  private final UserRoleAssignmentRepository userRoleAssignmentRepository;
  private final StoreRepository storeRepository;
  private final UserStoreRepository userStoreRepository;
  private final WarehouseService warehouseService;
  private final CustomUserDetailsService customUserDetailsService;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Value("${app.jwt.expiration-ms:86400000}")
  private long expirationMs;

  /** Mọi user đăng ký công khai đều nhận role này (mặc định quản lý cửa hàng). Không còn ngoại lệ SYSTEM_ADMIN cho user đầu. */
  @Value("${app.auth.register-default-role:STORE_MANAGER}")
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

    LocalDateTime t = LocalDateTime.now();
    AppUser user = new AppUser();
    user.setUsername(username);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(req.password()));
    user.setFullName(req.fullName().trim());
    if (req.phone() != null && !req.phone().isBlank()) {
      user.setPhone(req.phone().trim());
    }
    // Khớp ENUM MySQL users.status (ACTIVE/INACTIVE/LOCKED) và UserService.create — không dùng "active".
    user.setStatus("ACTIVE");
    user.setDefaultStore(null);
    user.setCreatedAt(t);
    user.setUpdatedAt(t);
    appUserRepository.save(user);

    String roleCode = registerDefaultRoleCode.trim();
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

    if ("STORE_MANAGER".equalsIgnoreCase(roleCode)) {
      assignOwnedStoreForNewStoreManager(user, t);
    }

    return buildAuthResponse(user, user.getUsername());
  }

  /**
   * Đăng ký công khai với STORE_MANAGER: JWT cần {@code storeIds} (user_stores). Không gán thì
   * client báo "chưa được gán cửa hàng" và không tạo sản phẩm được.
   */
  private void assignOwnedStoreForNewStoreManager(AppUser user, LocalDateTime t) {
    String baseCode = "CH-" + user.getId();
    String code = baseCode;
    int n = 0;
    while (storeRepository.existsByStoreCode(code)) {
      n++;
      code = baseCode + "-" + n;
    }
    String name = user.getFullName().trim() + " — Cửa hàng";
    if (name.length() > 255) {
      name = name.substring(0, 255);
    }
    Store store = new Store();
    store.setStoreCode(code);
    store.setStoreName(name);
    store.setPhone(user.getPhone());
    store.setEmail(user.getEmail());
    store.setAddress(null);
    store.setStatus("ACTIVE");
    store.setCreatedAt(t);
    store.setUpdatedAt(t);
    storeRepository.save(store);
    warehouseService.ensureCentralWarehouse(store.getId());

    UserStore us = new UserStore();
    us.setId(new UserStore.Pk(user.getId(), store.getId()));
    us.setPrimary(true);
    userStoreRepository.save(us);

    user.setDefaultStore(store);
    appUserRepository.save(user);
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
        jp.branchIds(),
        defaultStoreId);
  }

  @Transactional
  public void changePassword(ChangePasswordRequest req) {
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

    if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_PASSWORD,
          "Mật khẩu hiện tại không đúng.");
    }

    if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_PASSWORD,
          "Mật khẩu mới phải khác mật khẩu hiện tại.");
    }

    user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    appUserRepository.save(user);
  }

  private void assertAccountAllowedForLogin(AppUser user) {
    String st = user.getStatus() == null ? "" : user.getStatus().trim();
    // Tránh 403 oan khi cột status rỗng / dữ liệu cũ; chỉ chặn LOCKED và INACTIVE rõ ràng.
    if (st.isEmpty()) {
      return;
    }
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
            principal.getAssignedStoreIds(),
            principal.getAssignedBranchIds());

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
        List.copyOf(permissionCodes),
        List.copyOf(principal.getAssignedStoreIds()),
        List.copyOf(principal.getAssignedBranchIds()));
  }
}
