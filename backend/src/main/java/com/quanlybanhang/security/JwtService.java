package com.quanlybanhang.security;

import com.quanlybanhang.config.JwtProperties;
import io.jsonwebtoken.Claims;
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

  public String generateToken(long userId, String username, List<String> roleCodes) {
    long now = System.currentTimeMillis();
    Date exp = new Date(now + props.getExpirationMs());
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim("username", username)
        .claim("roles", roleCodes)
        .issuedAt(new Date(now))
        .expiration(exp)
        .signWith(signingKey())
        .compact();
  }

  public Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
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
