/** Chuyển giá trị `datetime-local` thành chuỗi thời gian gửi backend (không đổi múi giờ). */
export function datetimeLocalToBackend(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.length === 16) return `${v}:00`;
  return v;
}
