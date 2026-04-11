import type { ApiErrorBody } from "@/types/auth";

export function messageForApiCode(code: string | undefined): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    UNAUTHORIZED: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_CREDENTIALS: "Sai tên đăng nhập hoặc mật khẩu.",
    ACCOUNT_LOCKED: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
    ACCOUNT_INACTIVE: "Tài khoản chưa được kích hoạt.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    USERNAME_ALREADY_EXISTS: "Tên đăng nhập đã được sử dụng.",
    EMAIL_ALREADY_EXISTS: "Email đã được sử dụng.",
    VALIDATION_ERROR: "Thông tin gửi lên không hợp lệ. Vui lòng kiểm tra lại các trường.",
    NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
    BUSINESS_RULE: "Không thể thực hiện do quy tắc nghiệp vụ.",
    DATA_INTEGRITY: "Dữ liệu xung đột hoặc trùng lặp. Vui lòng kiểm tra lại.",
    INTERNAL_ERROR: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
  };
  return map[code] ?? null;
}

export function formatApiError(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const ax = err as { response?: { data?: ApiErrorBody } };
    const data = ax.response?.data;
    if (data?.code) {
      const mapped = messageForApiCode(data.code);
      if (mapped) return mapped;
      return "Không thể thực hiện yêu cầu. Vui lòng thử lại hoặc kiểm tra quyền.";
    }
  }
  if (err instanceof Error && err.message) {
    if (err.message === "Network Error") {
      return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng hoặc khởi động backend.";
    }
    return err.message;
  }
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
}
