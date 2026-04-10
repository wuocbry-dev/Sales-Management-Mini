package com.quanlybanhang.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
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
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String uri = request.getRequestURI();
    String ctx = request.getContextPath();
    if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
      uri = uri.substring(ctx.length());
    }
    if (isPublicPath(uri)) {
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
      long userId = Long.parseLong(claims.getSubject());
      String username = claims.get("username", String.class);
      if (username == null) {
        username = "";
      }
      String fullName = claims.get("fullName", String.class);
      if (fullName == null) {
        fullName = "";
      }
      List<Long> storeIds = toLongList(claims.get("storeIds"));

      @SuppressWarnings("unchecked")
      List<String> roles = claims.get("roles", List.class);
      if (roles == null) {
        roles = List.of();
      }
      @SuppressWarnings("unchecked")
      List<String> permissions = claims.get("permissions", List.class);
      if (permissions == null) {
        permissions = List.of();
      }

      var authorities = new ArrayList<SimpleGrantedAuthority>();
      for (String r : roles) {
        if (r != null && !r.isBlank()) {
          authorities.add(new SimpleGrantedAuthority("ROLE_" + r.trim()));
        }
      }
      for (String p : permissions) {
        if (p != null && !p.isBlank()) {
          authorities.add(new SimpleGrantedAuthority(p.trim()));
        }
      }

      var principal = new JwtAuthenticatedPrincipal(userId, username, fullName, storeIds);
      var auth =
          new UsernamePasswordAuthenticationToken(principal, null, authorities);
      auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(auth);
    } catch (Exception ignored) {
      // Token sai / hết hạn: anonymous → 401 khi endpoint yêu cầu authenticated
    }
    filterChain.doFilter(request, response);
  }

  private static boolean isPublicPath(String path) {
    return "/api/health".equals(path)
        || "/api/auth/login".equals(path)
        || "/api/auth/register".equals(path);
  }

  private static List<Long> toLongList(Object raw) {
    if (!(raw instanceof List<?> list)) {
      return List.of();
    }
    List<Long> out = new ArrayList<>();
    for (Object e : list) {
      if (e instanceof Number n) {
        out.add(n.longValue());
      } else if (e != null) {
        try {
          out.add(Long.parseLong(e.toString()));
        } catch (NumberFormatException ignored) {
          // bỏ qua phần tử không parse được
        }
      }
    }
    return List.copyOf(out);
  }
}
