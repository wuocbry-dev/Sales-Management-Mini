package com.quanlybanhang.exception;

import org.springframework.http.HttpStatus;

/** Lỗi API auth có HTTP status + {@link AuthErrorCodes} rõ ràng. */
public final class AuthApiException extends RuntimeException {

  private final int httpStatus;
  private final String errorCode;

  public AuthApiException(HttpStatus status, String errorCode, String message) {
    super(message);
    this.httpStatus = status.value();
    this.errorCode = errorCode;
  }

  public int getHttpStatus() {
    return httpStatus;
  }

  public String getErrorCode() {
    return errorCode;
  }
}
