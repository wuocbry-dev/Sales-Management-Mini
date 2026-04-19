const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Định dạng ngày giờ hiển thị theo múi giờ Việt Nam (GMT+7). */
export function formatDateTimeVi(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(d);
}
