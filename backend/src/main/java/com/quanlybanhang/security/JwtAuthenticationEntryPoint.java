package com.quanlybanhang.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.exception.ApiErrorResponse;
import com.quanlybanhang.exception.AuthErrorCodes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(
        response.getOutputStream(),
        ApiErrorResponse.of(
            401,
            AuthErrorCodes.UNAUTHORIZED,
            authException.getMessage() != null
                ? authException.getMessage()
                : "Cần Bearer token hợp lệ."));
  }
}
