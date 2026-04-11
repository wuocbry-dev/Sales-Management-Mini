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

  public static final String INVALID_PASSWORD = "INVALID_PASSWORD";

  /** STORE_MANAGER chỉ được tạo CASHIER / WAREHOUSE_STAFF qua API store-staff. */
  public static final String INVALID_ROLE_FOR_STORE_MANAGER = "INVALID_ROLE_FOR_STORE_MANAGER";

  public static final String BRANCH_NOT_FOUND = "BRANCH_NOT_FOUND";

  /** Chi nhánh không thuộc cửa hàng mà STORE_MANAGER được gán. */
  public static final String BRANCH_NOT_IN_MANAGER_STORE = "BRANCH_NOT_IN_MANAGER_STORE";

  /** STORE_MANAGER chưa được gán cửa hàng (JWT storeIds rỗng). */
  public static final String STORE_MANAGER_NOT_ASSIGNED_TO_STORE =
      "STORE_MANAGER_NOT_ASSIGNED_TO_STORE";

  public static final String USER_NOT_FOUND = "USER_NOT_FOUND";

  /** User không phải chỉ CASHIER / WAREHOUSE_STAFF (hoặc chưa đủ điều kiện điều chuyển). */
  public static final String INVALID_TARGET_ROLE = "INVALID_TARGET_ROLE";

  /** User / chi nhánh hiện tại ngoài phạm vi cửa hàng STORE_MANAGER quản lý. */
  public static final String USER_NOT_IN_MANAGER_SCOPE = "USER_NOT_IN_MANAGER_SCOPE";

  /** Chi nhánh đích không thuộc cùng cửa hàng hoặc ngoài quyền quản lý. */
  public static final String TARGET_BRANCH_NOT_IN_MANAGER_STORE =
      "TARGET_BRANCH_NOT_IN_MANAGER_STORE";

  public static final String SAME_BRANCH_ASSIGNMENT = "SAME_BRANCH_ASSIGNMENT";

  /** Không vô hiệu (xóa mềm) tài khoản đang đăng nhập. */
  public static final String CANNOT_DEACTIVATE_SELF = "CANNOT_DEACTIVATE_SELF";
}
