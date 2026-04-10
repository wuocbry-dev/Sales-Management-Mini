package com.quanlybanhang.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AuthDtos {

  private AuthDtos() {}

  public record RegisterRequest(
      @NotBlank @Size(max = 50) String username,
      @NotBlank @Email @Size(max = 100) String email,
      @NotBlank @Size(min = 6, max = 100) String password,
      @NotBlank @Size(max = 150) String fullName,
      @Size(max = 20) String phone) {}

  /** Trường {@code username}: tên đăng nhập hoặc email. */
  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

  public record AuthUserInfo(
      Long id,
      String username,
      String email,
      String fullName,
      String phone,
      String status) {}

  /** Sau đăng nhập / đăng ký: JWT + thông tin user + role + permission. */
  public record AuthResponse(
      String accessToken,
      String tokenType,
      long expiresInSeconds,
      AuthUserInfo user,
      List<String> roles,
      List<String> permissions) {}

  /** Thông tin user hiện tại (JWT). */
  public record MeResponse(
      Long id,
      String username,
      String email,
      String fullName,
      String phone,
      String status,
      List<String> roles,
      List<String> permissions,
      List<Long> storeIds,
      Long defaultStoreId) {}
}
