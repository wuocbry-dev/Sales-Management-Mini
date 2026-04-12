import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchStoreById } from "@/api/stores-api";
import { assignBranchesForStoreUser, fetchStoreUsersPage } from "@/api/store-users-api";
import { fetchSystemUserById } from "@/api/users-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateStoreScopedUserAssignBranch, gateStoreScopedUserView } from "@/features/auth/gates";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatApiError } from "@/lib/api-errors";
import { formatRoleCodesForUi } from "@/lib/role-labels";

const DEFAULT_SIZE = 15;

function isActiveAccountStatus(status: string) {
  return status.trim().toUpperCase() === "ACTIVE";
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function StoreScopedUsersPage() {
  const location = useLocation();
  const { storeId: storeIdParam } = useParams();
  const storeId = Number(storeIdParam);
  const invalid = !Number.isFinite(storeId) || storeId <= 0;
  const me = useAuthStore((s) => s.me);
  const canView = Boolean(me && gateStoreScopedUserView(me));
  const canAssign = Boolean(me && gateStoreScopedUserAssignBranch(me));
  const canPrefill = Boolean(me && isSystemManage(me));

  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickUserId, setPickUserId] = useState<number | null>(null);
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("");

  const qc = useQueryClient();

  const storeQ = useQuery({
    queryKey: ["stores", storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !invalid && canView,
  });

  const listQ = useQuery({
    queryKey: ["store-users", storeId, page, size],
    queryFn: () => fetchStoreUsersPage(storeId, { page, size }),
    enabled: !invalid && canView,
  });

  const branchesQ = useQuery({
    queryKey: ["store-users-branches", storeId],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 500 }),
    enabled: !invalid && canView && dialogOpen,
  });

  const prefillQ = useQuery({
    queryKey: ["system-users", pickUserId, "prefill-store", storeId],
    queryFn: () => fetchSystemUserById(pickUserId!),
    enabled: Boolean(dialogOpen && pickUserId && canPrefill),
  });

  useEffect(() => {
    if (!dialogOpen || !pickUserId) return;
    const detail = prefillQ.data;
    if (canPrefill && detail) {
      const inStore = detail.branches.filter((b) => b.storeId === storeId);
      setBranchIds(inStore.map((b) => b.branchId));
      const prim = inStore.find((b) => b.primary);
      setPrimaryBranchId(prim ? String(prim.branchId) : "");
    } else if (!canPrefill) {
      setBranchIds([]);
      setPrimaryBranchId("");
    }
  }, [dialogOpen, pickUserId, canPrefill, prefillQ.data, storeId]);

  const assignM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () =>
      assignBranchesForStoreUser(storeId, pickUserId!, {
        branchIds,
        primaryBranchId: primaryBranchId === "" ? null : Number(primaryBranchId),
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật chi nhánh trong cửa hàng.");
      await qc.invalidateQueries({ queryKey: ["store-users", storeId] });
      setDialogOpen(false);
      setPickUserId(null);
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  const openAssign = (userId: number) => {
    setPickUserId(userId);
    setDialogOpen(true);
    if (!canPrefill) {
      setBranchIds([]);
      setPrimaryBranchId("");
    }
  };

  const toggleBranch = (bid: number, on: boolean) => {
    setBranchIds((prev) => {
      if (on) return [...prev, bid];
      const next = prev.filter((x) => x !== bid);
      if (primaryBranchId && Number(primaryBranchId) === bid) setPrimaryBranchId("");
      return next;
    });
  };

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!canView) return null;

  if (storeQ.isPending || listQ.isPending) return <PageSkeleton cards={2} />;
  if (storeQ.isError) return <ApiErrorState error={storeQ.error} onRetry={() => void storeQ.refetch()} />;
  if (listQ.isError) return <ApiErrorState error={listQ.error} onRetry={() => void listQ.refetch()} />;

  const st = storeQ.data;
  const data = listQ.data;
  const branchRows = branchesQ.data?.content ?? [];
  const backTo =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from
      ? (location.state as { from?: string }).from!
      : "/app/nguoi-dung-cua-hang";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={backTo}>← Quay lại</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Người dùng trong cửa hàng</CardTitle>
          <CardDescription>
            {st.storeName} — phân chi nhánh làm việc trong phạm vi cửa hàng này. Người dùng{" "}
            <strong>ngưng hoạt động</strong> không thể phân chi nhánh.
            {!canPrefill && canAssign ? (
              <span className="mt-2 block text-amber-700 dark:text-amber-400">
                Khi lưu, danh sách chi nhánh bạn chọn sẽ thay thế hoàn toàn phân quyền chi nhánh hiện có của người dùng tại
                cửa hàng này.
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[160px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Chưa có người dùng liên kết cửa hàng này.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.username}</TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell className="text-sm">{row.email}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                        {formatRoleCodesForUi(row.roleCodes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{userAccountStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canAssign ? (
                          isActiveAccountStatus(row.status) ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => openAssign(row.id)}>
                              Phân chi nhánh
                            </Button>
                          ) : (
                            <span
                              className="text-xs text-muted-foreground"
                              title="Người dùng ngưng hoạt động — không phân chi nhánh."
                            >
                              —
                            </span>
                          )
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={data} onPageChange={setPage} disabled={listQ.isFetching} />
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setPickUserId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phân chi nhánh trong cửa hàng</DialogTitle>
            <DialogDescription>Chọn chi nhánh được phép làm việc và chi nhánh chính (nếu có).</DialogDescription>
          </DialogHeader>
          {branchesQ.isPending ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách chi nhánh…</p>
          ) : branchRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cửa hàng chưa có chi nhánh.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3">
                {branchRows.map((b) => (
                  <label key={b.branchId} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-input"
                      checked={branchIds.includes(b.branchId)}
                      onChange={(e) => toggleBranch(b.branchId, e.target.checked)}
                    />
                    <span>
                      {b.branchName}
                      <span className="ml-1 text-xs text-muted-foreground">({b.branchCode})</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Chi nhánh chính</Label>
                <select className={selectClass} value={primaryBranchId} onChange={(e) => setPrimaryBranchId(e.target.value)}>
                  <option value="">Không chọn</option>
                  {branchRows
                    .filter((b) => branchIds.includes(b.branchId))
                    .map((b) => (
                      <option key={b.branchId} value={String(b.branchId)}>
                        {b.branchName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              disabled={assignM.isPending || !pickUserId || branchIds.length === 0}
              onClick={() => assignM.mutate()}
            >
              {assignM.isPending ? "Đang lưu…" : "Lưu phân chi nhánh"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
