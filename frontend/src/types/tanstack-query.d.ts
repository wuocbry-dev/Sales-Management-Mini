import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Khi bật: không hiển thị thông báo lỗi toàn cục (màn hình tự xử lý). */
      skipGlobalErrorToast?: boolean;
    };
  }
}
