package com.quanlybanhang.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

  /** Chuỗi bất kỳ; sẽ băm SHA-256 thành khóa HS256. */
  private String secret = "dev-only-change-in-production-minimum-32-characters-long";

  private long expirationMs = 86_400_000L;

  public String getSecret() {
    return secret;
  }

  public void setSecret(String secret) {
    this.secret = secret;
  }

  public long getExpirationMs() {
    return expirationMs;
  }

  public void setExpirationMs(long expirationMs) {
    this.expirationMs = expirationMs;
  }
}
