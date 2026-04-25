import type { AccessGate } from "@/features/auth/gates";

export type AppRouteHandle = {
  title: string;
  /** Dòng mô tả dưới tiêu đề trang (tuỳ chọn). */
  subtitle?: string;
  description?: string;
  /** Ẩn khỏi breadcrumb (ví dụ trang lỗi). */
  hideFromBreadcrumb?: boolean;
  /** Nếu có: người dùng không thỏa sẽ được chuyển tới trang thông báo. */
  requireAccess?: AccessGate;
  /** Cho các màn hình công cụ cần chiếm toàn bộ vùng nội dung, ví dụ POS/AI Agent. */
  fullBleed?: boolean;
};
