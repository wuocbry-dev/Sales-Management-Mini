package com.quanlybanhang.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> notFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiErrorResponse.of(404, "NOT_FOUND", ex.getMessage()));
  }

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiErrorResponse> business(BusinessException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiErrorResponse.of(400, "BUSINESS_RULE", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> validation(MethodArgumentNotValidException ex) {
    Map<String, String> fields = new LinkedHashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(fe -> fields.put(fe.getField(), fe.getDefaultMessage() != null ? fe.getDefaultMessage() : ""));
    String msg =
        fields.entrySet().stream()
            .map(e -> e.getKey() + ": " + e.getValue())
            .collect(Collectors.joining("; "));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiErrorResponse.validation(fields, msg.isEmpty() ? "Validation failed" : msg));
  }

  /** Lỗi auth: mã {@link AuthErrorCodes} + HTTP status (401/403/409…). */
  @ExceptionHandler(AuthApiException.class)
  public ResponseEntity<ApiErrorResponse> authApi(AuthApiException ex) {
    return ResponseEntity.status(ex.getHttpStatus())
        .body(ApiErrorResponse.of(ex.getHttpStatus(), ex.getErrorCode(), ex.getMessage()));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiErrorResponse> badCredentials(BadCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(
            ApiErrorResponse.of(
                401,
                AuthErrorCodes.INVALID_CREDENTIALS,
                ex.getMessage() != null ? ex.getMessage() : "Sai tên đăng nhập hoặc mật khẩu"));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiErrorResponse> accessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(
            ApiErrorResponse.of(
                403,
                AuthErrorCodes.FORBIDDEN,
                ex.getMessage() != null ? ex.getMessage() : "Không có quyền thực hiện."));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiErrorResponse> dataIntegrity(DataIntegrityViolationException ex) {
    log.warn("Data integrity: {}", ex.getMostSpecificCause().getMessage());
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            ApiErrorResponse.of(
                409,
                "DATA_INTEGRITY",
                "Dữ liệu xung đột hoặc vi phạm ràng buộc (trùng mã, khóa ngoại…)."));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> fallback(Exception ex) {
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            ApiErrorResponse.of(
                500, "INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
  }
}
