package com.quanlybanhang.security;

import com.quanlybanhang.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtProperties props;

  public JwtService(JwtProperties props) {
    this.props = props;
  }

  /**
   * Tạo JWT stateless. Claims: {@code sub}=userId, {@code username}, {@code fullName}, {@code
   * roles} (mã role), {@code permissions} (mã quyền), {@code storeIds}.
   */
  public String generateToken(
      long userId,
      String username,
      String fullName,
      List<String> roleCodes,
      List<String> permissionCodes,
      List<Long> storeIds) {
    long now = System.currentTimeMillis();
    Date exp = new Date(now + props.getExpirationMs());
    String fn = fullName != null ? fullName : "";
    List<String> roles = roleCodes != null ? roleCodes : List.of();
    List<String> perms = permissionCodes != null ? permissionCodes : List.of();
    List<Long> stores = storeIds != null ? storeIds : List.of();
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim("username", username)
        .claim("fullName", fn)
        .claim("roles", roles)
        .claim("permissions", perms)
        .claim("storeIds", stores)
        .issuedAt(new Date(now))
        .expiration(exp)
        .signWith(signingKey())
        .compact();
  }

  public Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
  }

  /** Lấy username (đăng nhập) từ token; token sai/hết hạn → ném {@link JwtException}. */
  public String extractUsername(String token) {
    return parseClaims(token).get("username", String.class);
  }

  /** Token hợp lệ (chữ ký + thời gian). */
  public boolean validateToken(String token) {
    if (token == null || token.isBlank()) {
      return false;
    }
    try {
      parseClaims(token.trim());
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  private SecretKey signingKey() {
    try {
      MessageDigest sha = MessageDigest.getInstance("SHA-256");
      byte[] keyBytes = sha.digest(props.getSecret().getBytes(StandardCharsets.UTF_8));
      return Keys.hmacShaKeyFor(keyBytes);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
