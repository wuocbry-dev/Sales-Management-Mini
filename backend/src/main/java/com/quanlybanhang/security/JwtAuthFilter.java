package com.quanlybanhang.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    if (path.startsWith(request.getContextPath() + "/api/auth/login")
        || path.equals(request.getContextPath() + "/api/health")) {
      filterChain.doFilter(request, response);
      return;
    }
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }
    String token = header.substring(7).trim();
    try {
      Claims claims = jwtService.parseClaims(token);
      Long userId = Long.parseLong(claims.getSubject());
      @SuppressWarnings("unchecked")
      List<String> roles = claims.get("roles", List.class);
      if (roles == null) {
        roles = List.of();
      }
      var authorities =
          roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
      var auth =
          new UsernamePasswordAuthenticationToken(
              String.valueOf(userId), null, authorities);
      auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(auth);
    } catch (Exception ignored) {
      // Token sai / hết hạn: để anonymous → 401 khi endpoint yêu cầu auth
    }
    filterChain.doFilter(request, response);
  }
}
