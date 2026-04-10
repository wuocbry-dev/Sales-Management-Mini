package com.quanlybanhang.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class AuthDtos {

  private AuthDtos() {}

  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

  public record LoginResponse(
      String accessToken,
      String tokenType,
      long expiresInSeconds,
      Long userId,
      String username,
      List<String> roles) {}
}
