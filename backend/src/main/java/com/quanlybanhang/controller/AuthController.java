package com.quanlybanhang.controller;

import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.AuthDtos.LoginResponse;
import com.quanlybanhang.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    return authService.login(req);
  }
}
