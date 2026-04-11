import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import { changeStoreStaffBranch, fetchStoreStaffById } from "@/api/store-staff-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatApiError } from "@/lib/api-errors";
import { formatDateTimeVi } from "@/lib/format-datetime";

const selectClass =
  "flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StoreStaffDetailPage() {
  const { id } = useParams();
  const uid = Number(id);
  const invalid = !Number.isFinite(uid) || uid <= 0;
  const qc = useQueryClient();
  const [newBranchId, setNewBranchId] = useState<string>("");

  const q = useQuery({
    queryKey: ["store-staff", uid],
    queryFn: () => fetchStoreStaffById(uid),
    enabled: !invalid,
  });

  const storeId = q.data?.storeId ?? 0;
  const branchesQ = useQuery({
    queryKey: ["branches", storeId, "staff-detail"],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 500 }),
    enabled: storeId > 0,
  });

  const changeM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => changeStoreStaffBranch(uid, { newBranchId: Number(newBranchId) }),
    onSuccess: async () => {
      toast.success("Đã đổi chi nhánh làm việc.");
      setNewBranchId("");
      await qc.invalidateQueries({ queryKey: ["store-staff"] });
      await qc.invalidateQueries({ queryKey: ["store-staff", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const row = q.data;
  const branches = branchesQ.data?.content ?? [];
  const curBranch = branches.find((b) => b.branchId === row.branchId);
  const otherBranches = branches.filter((b) => b.branchId !== row.branchId);

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/nhan-vien-cua-hang">← Danh sách nhân viên</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-mono text-xl">{row.username}</CardTitle>
            <Badge variant="secondary">{userAccountStatusLabel(row.status)}</Badge>
          </div>
          <CardDescription>Nhân viên cửa hàng — mã nội bộ #{row.userId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Họ tên</p>
            <p className="text-sm font-medium">{row.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
            <p className="text-sm">{row.roleCode}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cửa hàng</p>
            <p className="text-sm">{row.storeId}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Chi nhánh hiện tại</p>
            <p className="text-sm">
              {curBranch ? `${curBranch.branchName} (${curBranch.branchCode})` : `Mã ${row.branchId}`}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Tạo lúc</p>
            <p className="text-sm">{formatDateTimeVi(row.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đổi chi nhánh làm việc</CardTitle>
          <CardDescription>Chỉ được chọn chi nhánh khác thuộc cùng cửa hàng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branchesQ.isPending ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách chi nhánh…</p>
          ) : otherBranches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không còn chi nhánh khác trong cửa hàng này.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nb">Chi nhánh mới</Label>
                <select
                  id="nb"
                  className={selectClass}
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                >
                  <option value="">Chọn chi nhánh</option>
                  {otherBranches.map((b) => (
                    <option key={b.branchId} value={String(b.branchId)}>
                      {b.branchName} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                disabled={changeM.isPending || newBranchId === ""}
                onClick={() => changeM.mutate()}
              >
                {changeM.isPending ? "Đang lưu…" : "Áp dụng đổi chi nhánh"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
