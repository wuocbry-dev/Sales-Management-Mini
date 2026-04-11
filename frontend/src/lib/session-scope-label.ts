import type { MeResponse } from "@/types/auth";

/** Mô tả phạm vi được giao từ `storeIds` / `branchIds` — không liệt kê mã định danh. */
export function describeSessionScope(me: MeResponse): string | null {
  const nStore = me.storeIds?.length ?? 0;
  const nBranch = me.branchIds?.length ?? 0;
  if (nStore === 0 && nBranch === 0) return null;
  const parts: string[] = [];
  if (nStore > 0) parts.push(`${nStore} cửa hàng`);
  if (nBranch > 0) parts.push(`${nBranch} chi nhánh`);
  return `Phạm vi được giao: ${parts.join(" và ")}.`;
}
