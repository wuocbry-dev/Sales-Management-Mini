import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchRbacRolesPage } from "@/api/rbac-api";
import {
  assignSystemUserBranches,
  assignSystemUserRoles,
  assignSystemUserStores,
  fetchSystemUserById,
  updateSystemUser,
  updateSystemUserStatus,
} from "@/api/users-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatApiError } from "@/lib/api-errors";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function SystemUserDetailPage() {
  const { id } = useParams();
  const uid = Number(id);
  const invalid = !Number.isFinite(uid) || uid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["system-users", uid],
    queryFn: () => fetchSystemUserById(uid),
    enabled: !invalid,
  });

  const rolesCatalog = useQuery({
    queryKey: ["rbac-roles", "detail-user"],
    queryFn: () => fetchRbacRolesPage({ page: 0, size: 200 }),
  });

  const { stores: storeCatalog, getStoreName } = useStoreNameMap({ enabled: !invalid });

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultStoreId, setDefaultStoreId] = useState<string>("");
  const [status, setStatus] = useState("ACTIVE");
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [storeIds, setStoreIds] = useState<number[]>([]);
  const [primaryStoreId, setPrimaryStoreId] = useState<string>("");
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("");

  useEffect(() => {
    const d = q.data;
    if (!d) return;
    setEmail(d.email);
    setFullName(d.fullName);
    setPhone(d.phone ?? "");
    setDefaultStoreId(d.defaultStoreId != null ? String(d.defaultStoreId) : "");
    setStatus(d.status);
    setRoleIds(d.roles.map((r) => r.id));
    setStoreIds(d.stores.map((s) => s.storeId));
    const primS = d.stores.find((s) => s.primary);
    setPrimaryStoreId(primS ? String(primS.storeId) : "");
    setBranchIds(d.branches.map((b) => b.branchId));
    const primB = d.branches.find((b) => b.primary);
    setPrimaryBranchId(primB ? String(primB.branchId) : "");
  }, [q.data, q.dataUpdatedAt]);

  const storeIdsKey = useMemo(() => storeIds.slice().sort((a, b) => a - b).join(","), [storeIds]);

  const branchesQueries = useQuery({
    queryKey: ["user-detail-branches", storeIdsKey],
    enabled: storeIds.length > 0,
    queryFn: async () => {
      const pages = await Promise.all(
        storeIds.map((sid) => fetchBranchesForStore(sid, { page: 0, size: 500 })),
      );
      const map = new Map<number, { branchId: number; storeId: number; branchCode: string; branchName: string }>();
      for (const p of pages) {
        for (const b of p.content) {
          map.set(b.branchId, {
            branchId: b.branchId,
            storeId: b.storeId,
            branchCode: b.branchCode,
            branchName: b.branchName,
          });
        }
      }
      return [...map.values()].sort((a, b) => a.branchName.localeCompare(b.branchName, "vi"));
    },
  });

  const branchOptions = branchesQueries.data ?? [];

  const selectedStores = useMemo(
    () => storeCatalog.filter((s) => storeIds.includes(s.id)),
    [storeCatalog, storeIds],
  );

  const updateProfile = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () =>
      updateSystemUser(uid, {
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        defaultStoreId: defaultStoreId === "" ? null : Number(defaultStoreId),
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật hồ sơ.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      await qc.invalidateQueries({ queryKey: ["system-users", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const updateStatusM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => updateSystemUserStatus(uid, { status }),
    onSuccess: async () => {
      toast.success("Đã cập nhật trạng thái.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      await qc.invalidateQueries({ queryKey: ["system-users", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const assignRolesM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => assignSystemUserRoles(uid, { roleIds }),
    onSuccess: async () => {
      toast.success("Đã cập nhật vai trò.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      await qc.invalidateQueries({ queryKey: ["system-users", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const assignStoresM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () =>
      assignSystemUserStores(uid, {
        storeIds,
        primaryStoreId: primaryStoreId === "" ? null : Number(primaryStoreId),
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật cửa hàng.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      await qc.invalidateQueries({ queryKey: ["system-users", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const assignBranchesM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () =>
      assignSystemUserBranches(uid, {
        branchIds,
        primaryBranchId: primaryBranchId === "" ? null : Number(primaryBranchId),
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật chi nhánh.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      await qc.invalidateQueries({ queryKey: ["system-users", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const toggleRole = (rid: number, on: boolean) => {
    setRoleIds((prev) => (on ? [...prev, rid] : prev.filter((x) => x !== rid)));
  };

  const toggleStore = (sid: number, on: boolean) => {
    setStoreIds((prev) => {
      if (on) return [...prev, sid];
      const next = prev.filter((x) => x !== sid);
      if (primaryStoreId && Number(primaryStoreId) === sid) setPrimaryStoreId("");
      return next;
    });
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
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/nguoi-dung">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={3} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const d = q.data;
  const roles = rolesCatalog.data?.content ?? [];
  const stores = storeCatalog;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/nguoi-dung">← Danh sách người dùng</Link>
        </Button>
        <Badge variant="secondary">{userAccountStatusLabel(d.status)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xl">{d.username}</CardTitle>
          <CardDescription>Tài khoản hệ thống — mã nội bộ #{d.id}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hồ sơ</CardTitle>
          <CardDescription>Email, họ tên và cửa hàng mặc định khi đăng nhập.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-full">Họ và tên</Label>
              <Input id="su-full" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-phone">Điện thoại</Label>
              <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-defstore">Cửa hàng mặc định</Label>
              <select
                id="su-defstore"
                className={selectClass}
                value={defaultStoreId}
                onChange={(e) => setDefaultStoreId(e.target.value)}
              >
                <option value="">Không chọn</option>
                {stores.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="button" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate()}>
            {updateProfile.isPending ? "Đang lưu…" : "Lưu hồ sơ"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trạng thái tài khoản</CardTitle>
          <CardDescription>Hoạt động, ngưng hoặc khóa đăng nhập.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="su-status">Trạng thái</Label>
            <select id="su-status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </select>
          </div>
          <Button type="button" disabled={updateStatusM.isPending} onClick={() => updateStatusM.mutate()}>
            {updateStatusM.isPending ? "Đang lưu…" : "Áp dụng trạng thái"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vai trò</CardTitle>
          <CardDescription>Chọn một hoặc nhiều vai trò hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rolesCatalog.isPending ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : (
            <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
              {roles.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-input"
                    checked={roleIds.includes(r.id)}
                    onChange={(e) => toggleRole(r.id, e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">{r.roleName}</span>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">({r.roleCode})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <Button type="button" disabled={assignRolesM.isPending || roleIds.length === 0} onClick={() => assignRolesM.mutate()}>
            {assignRolesM.isPending ? "Đang lưu…" : "Lưu vai trò"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cửa hàng được phép</CardTitle>
          <CardDescription>Phạm vi cửa hàng và cửa hàng chính (nếu có).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
            {stores.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-input"
                  checked={storeIds.includes(s.id)}
                  onChange={(e) => toggleStore(s.id, e.target.checked)}
                />
                <span>{s.storeName}</span>
              </label>
            ))}
          </div>
          {selectedStores.length > 0 ? (
            <div className="space-y-2">
              <Label>Cửa hàng chính</Label>
              <select className={selectClass} value={primaryStoreId} onChange={(e) => setPrimaryStoreId(e.target.value)}>
                <option value="">Không chọn</option>
                {selectedStores.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button type="button" disabled={assignStoresM.isPending} onClick={() => assignStoresM.mutate()}>
            {assignStoresM.isPending ? "Đang lưu…" : "Lưu cửa hàng"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi nhánh được phép</CardTitle>
          <CardDescription>
            Chọn các chi nhánh thuộc các cửa hàng đã gán ở trên. Danh sách chi nhánh tải theo từng cửa hàng đã chọn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {storeIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hãy gán ít nhất một cửa hàng trước khi chọn chi nhánh.</p>
          ) : branchesQueries.isPending ? (
            <p className="text-sm text-muted-foreground">Đang tải chi nhánh…</p>
          ) : branchOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có chi nhánh trong phạm vi cửa hàng đã chọn.</p>
          ) : (
            <>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                {branchOptions.map((b) => (
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
                  {branchOptions
                    .filter((b) => branchIds.includes(b.branchId))
                    .map((b) => (
                      <option key={b.branchId} value={String(b.branchId)}>
                        {b.branchName}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
          <Button
            type="button"
            disabled={assignBranchesM.isPending || storeIds.length === 0 || branchIds.length === 0}
            onClick={() => assignBranchesM.mutate()}
          >
            {assignBranchesM.isPending ? "Đang lưu…" : "Lưu chi nhánh"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng quan gán hiện tại</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chi nhánh</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Cửa hàng</TableHead>
                <TableHead>Chính</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    Chưa gán chi nhánh.
                  </TableCell>
                </TableRow>
              ) : (
                d.branches.map((b) => (
                  <TableRow key={b.branchId}>
                    <TableCell>{b.branchName}</TableCell>
                    <TableCell className="font-mono text-sm">{b.branchCode}</TableCell>
                    <TableCell>{getStoreName(b.storeId)}</TableCell>
                    <TableCell>{b.primary ? "Có" : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
