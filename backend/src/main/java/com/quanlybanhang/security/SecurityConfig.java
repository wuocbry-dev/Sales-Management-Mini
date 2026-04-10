package com.quanlybanhang.security;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  /** Mã hóa / so khớp {@code users.password_hash} (BCrypt). */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      JwtAuthenticationEntryPoint entryPoint)
      throws Exception {
    http.cors(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/api/auth/login", "/api/auth/register", "/api/health")
                    .permitAll()
                    .requestMatchers("/api/**")
                    .authenticated())
        .addFilterBefore(
            jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource(
      @Value("${app.cors.allow-all-http-origins:false}") boolean allowAllHttpOrigins) {
    CorsConfiguration c = new CorsConfiguration();
    /*
     * Trình duyệt luôn gửi Origin và áp CORS; Postman/Kotlin/curl thì không → Postman "chạy" nhưng
     * frontend vẫn có thể bị chặn nếu Origin (localhost:5174, IP LAN, file://…) không khớp.
     * Chỉ bật app.cors.allow-all-http-origins=true trên máy dev khi cần (không dùng production).
     */
    List<String> patterns = new ArrayList<>();
    if (allowAllHttpOrigins) {
      patterns.add("http://*:*");
    } else {
      patterns.add("http://localhost:*");
      patterns.add("http://127.0.0.1:*");
      patterns.add("http://192.168.*:*");
      patterns.add("http://10.*:*");
    }
    c.setAllowedOriginPatterns(patterns);
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("*"));
    c.setAllowCredentials(true);
    c.setExposedHeaders(List.of(HttpHeaders.AUTHORIZATION));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", c);
    return source;
  }
}
