package com.quanlybanhang.exception;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/** Body lỗi thống nhất cho mọi API. */
public record ApiErrorResponse(
    Instant timestamp,
    int status,
    String code,
    String message,
    Map<String, String> fieldErrors) {

  public static ApiErrorResponse of(int status, String code, String message) {
    return new ApiErrorResponse(Instant.now(), status, code, message, Collections.emptyMap());
  }

  public static ApiErrorResponse validation(Map<String, String> fieldErrors, String message) {
    return new ApiErrorResponse(
        Instant.now(), 400, "VALIDATION_ERROR", message, Map.copyOf(fieldErrors));
  }
}
