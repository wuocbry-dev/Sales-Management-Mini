package com.quanlybanhang.exception;

/** Mã lỗi thống nhất cho luồng xác thực / phân quyền (JWT). */
public final class AuthErrorCodes {

  private AuthErrorCodes() {}

  public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
  public static final String ACCOUNT_LOCKED = "ACCOUNT_LOCKED";
  public static final String ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE";
  public static final String UNAUTHORIZED = "UNAUTHORIZED";
  public static final String FORBIDDEN = "FORBIDDEN";
  public static final String USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS";
  public static final String EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS";
}
