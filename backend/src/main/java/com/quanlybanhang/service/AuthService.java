package com.quanlybanhang.service;

import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.AuthDtos.LoginResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.security.JwtService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AppUserRepository appUserRepository;
  private final UserRoleAssignmentRepository userRoleAssignmentRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Value("${app.jwt.expiration-ms:86400000}")
  private long expirationMs;

  @Transactional(readOnly = true)
  public LoginResponse login(LoginRequest req) {
    AppUser user =
        appUserRepository
            .findByUsername(req.username().trim())
            .orElseThrow(() -> new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu"));
    if (!DomainConstants.STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
      throw new BusinessException("Tài khoản không hoạt động.");
    }
    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu");
    }
    List<UserRoleAssignment> links = userRoleAssignmentRepository.findById_UserId(user.getId());
    List<String> roleCodes = new ArrayList<>();
    for (UserRoleAssignment link : links) {
      roleRepository
          .findById(link.getId().getRoleId())
          .ifPresent(r -> roleCodes.add(r.getRoleCode()));
    }
    String token = jwtService.generateToken(user.getId(), user.getUsername(), roleCodes);
    return new LoginResponse(
        token,
        "Bearer",
        expirationMs / 1000,
        user.getId(),
        user.getUsername(),
        roleCodes);
  }
}
