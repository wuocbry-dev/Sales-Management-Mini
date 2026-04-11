import { Badge } from "@/components/ui/badge";
import { userStatusLabel } from "@/lib/user-status-labels";

type Props = {
  status: string | null | undefined;
};

/** Hiển thị trạng thái tài khoản bằng tiếng Việt, không in mã thô. */
export function UserStatusBadge({ status }: Props) {
  const s = (status ?? "").trim().toUpperCase();
  const label = userStatusLabel(status);
  if (s === "ACTIVE") {
    return <Badge variant="success">{label}</Badge>;
  }
  if (s === "INACTIVE") {
    return <Badge variant="warning">{label}</Badge>;
  }
  if (s === "LOCKED") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  return <Badge variant="muted">{label}</Badge>;
}
