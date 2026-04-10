package com.quanlybanhang.controller;

import com.quanlybanhang.dto.AuthDtos.AuthResponse;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.AuthDtos.MeResponse;
import com.quanlybanhang.dto.AuthDtos.RegisterRequest;
import com.quanlybanhang.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Auth JWT: register / login / me.
 *
 * <p>Hướng dẫn test nhanh (Postman / curl): xem {@code Docx/AUTH_API_TEST.md}.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
    return authService.register(req);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    return authService.login(req);
  }

  @GetMapping("/me")
  public MeResponse me() {
    return authService.me();
  }
}
