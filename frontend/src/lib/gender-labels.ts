export function genderLabel(gender: string | null | undefined): string {
  const g = (gender ?? "").trim().toUpperCase();
  if (g === "MALE") return "Nam";
  if (g === "FEMALE") return "Nữ";
  if (g === "OTHER") return "Khác";
  if (!g) return "—";
  return gender ?? "—";
}
