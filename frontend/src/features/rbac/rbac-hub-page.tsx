import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import {
  createPermissionOverride,
  deletePermissionOverride,
  fetchPermissionOverrides,
  fetchRbacPermissionsPage,
  fetchRbacRolesPage,
} from "@/api/rbac-api";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/auth-store";
import { gateRbacAreaRoute, gateRbacOverridesManage } from "@/features/auth/gates";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { formatApiError } from "@/lib/api-errors";
import { roleUiLabel } from "@/lib/role-labels";
import type { PermissionListRow, PermissionOverrideRow } from "@/types/rbac";

type OverrideScope = "GLOBAL" | "STORE" | "BRANCH";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function overrideTypeLabel(t: string): string {
  const u = (t ?? "").toUpperCase();
  if (u === "ALLOW") return "Cho phép";
  if (u === "DENY") return "Chặn";
  return "Mặc định";
}

function isInScope(row: PermissionOverrideRow, scope: OverrideScope, storeId: number | null, branchId: number | null): boolean {
  if (scope === "GLOBAL") return row.storeId == null && row.branchId == null;
  if (scope === "STORE") return storeId != null && row.storeId === storeId && row.branchId == null;
  return branchId != null && row.branchId === branchId;
}

function moduleLabel(name: string | null): string {
  if (!name || !name.trim()) return "Khác";
  return name.trim();
}

export function RbacHubPage() {
  const me = useAuthStore((s) => s.me);
  const canArea = Boolean(me && gateRbacAreaRoute(me));
  const canManage = Boolean(me && gateRbacOverridesManage(me));
  const { getStoreName } = useStoreNameMap({ enabled: canArea });
  const qc = useQueryClient();

  const [scopeRoleId, setScopeRoleId] = useState<string>("");
  const [scopeType, setScopeType] = useState<OverrideScope>("GLOBAL");
  const [scopeStoreId, setScopeStoreId] = useState<string>("");
  const [scopeBranchId, setScopeBranchId] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [pendingByPermission, setPendingByPermission] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const selectedRoleId = scopeRoleId ? Number(scopeRoleId) : null;
  const selectedStoreId = scopeStoreId ? Number(scopeStoreId) : null;
  const selectedBranchId = scopeBranchId ? Number(scopeBranchId) : null;
  const roleFilter = selectedRoleId && Number.isFinite(selectedRoleId) ? selectedRoleId : undefined;

  const rolesQ = useQuery({
    queryKey: ["rbac-roles", "all"],
    queryFn: () => fetchRbacRolesPage({ page: 0, size: 200 }),
    enabled: canArea,
  });

  const permissionsQ = useQuery({
    queryKey: ["rbac-permissions", "all"],
    queryFn: () => fetchRbacPermissionsPage({ page: 0, size: 500 }),
    enabled: canArea,
  });

  const storesQ = useQuery({
    queryKey: ["stores", "rbac-scope"],
    queryFn: () => fetchStoresPage({ page: 0, size: 500 }),
    enabled: canArea,
  });

  const branchesQ = useQuery({
    queryKey: ["branches", "rbac-scope", selectedStoreId],
    queryFn: () => fetchBranchesForStore(selectedStoreId!, { page: 0, size: 500 }),
    enabled: canArea && selectedStoreId != null && selectedStoreId > 0,
  });

  const overridesQ = useQuery({
    queryKey: ["rbac-overrides", roleFilter],
    queryFn: () => fetchPermissionOverrides(roleFilter),
    enabled: canArea && roleFilter != null,
  });

  useEffect(() => {
    setPendingByPermission({});
  }, [scopeRoleId, scopeType, scopeStoreId, scopeBranchId]);

  const scopedOverrides = useMemo(() => {
    if (!overridesQ.data) return [];
    return overridesQ.data.filter((row) => isInScope(row, scopeType, selectedStoreId, selectedBranchId));
  }, [overridesQ.data, scopeType, selectedStoreId, selectedBranchId]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of branchesQ.data?.content ?? []) {
      map.set(b.branchId, `${b.branchName} (${b.branchCode})`);
    }
    return map;
  }, [branchesQ.data]);

  const overrideByPermission = useMemo(() => {
    const map = new Map<number, PermissionOverrideRow[]>();
    for (const row of scopedOverrides) {
      const list = map.get(row.permissionId) ?? [];
      list.push(row);
      map.set(row.permissionId, list);
    }
    return map;
  }, [scopedOverrides]);

  const permissionRows = useMemo(() => {
    const rows = permissionsQ.data?.content ?? [];
    const k = keyword.trim().toLowerCase();
    const filtered =
      k.length === 0
        ? rows
        : rows.filter((p) => {
            const m = moduleLabel(p.moduleName).toLowerCase();
            return (
              p.permissionCode.toLowerCase().includes(k) ||
              p.permissionName.toLowerCase().includes(k) ||
              m.includes(k)
            );
          });
    return [...filtered].sort((a, b) => {
      const ma = moduleLabel(a.moduleName);
      const mb = moduleLabel(b.moduleName);
      if (ma !== mb) return ma.localeCompare(mb, "vi");
      return a.permissionName.localeCompare(b.permissionName, "vi");
    });
  }, [permissionsQ.data, keyword]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionListRow[]>();
    for (const row of permissionRows) {
      const key = moduleLabel(row.moduleName);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [permissionRows]);

  const hasPending = Object.keys(pendingByPermission).length > 0;

  const deleteM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (id: number) => deletePermissionOverride(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rbac-overrides"] });
      toast.success("Đã xoá ghi đè.");
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const saveChanges = async () => {
    if (!selectedRoleId) {
      toast.error("Bạn chưa chọn vai trò.");
      return;
    }
    if (scopeType !== "GLOBAL" && !selectedStoreId) {
      toast.error("Bạn chưa chọn cửa hàng.");
      return;
    }
    if (scopeType === "BRANCH" && !selectedBranchId) {
      toast.error("Bạn chưa chọn chi nhánh.");
      return;
    }
    if (!hasPending) {
      toast.message("Không có thay đổi để lưu.");
      return;
    }

    setIsSaving(true);
    try {
      for (const [pidText, checked] of Object.entries(pendingByPermission)) {
        const permissionId = Number(pidText);
        const existing = overrideByPermission.get(permissionId) ?? [];
        const desired = checked ? "ALLOW" : "DENY";
        const hasExact = existing.some((x) => (x.overrideType ?? "").toUpperCase() === desired);
        if (hasExact && existing.length === 1) continue;

        for (const row of existing) {
          await deletePermissionOverride(row.overrideId);
        }
        await createPermissionOverride({
          roleId: selectedRoleId,
          permissionId,
          storeId: scopeType === "GLOBAL" ? null : selectedStoreId,
          branchId: scopeType === "BRANCH" ? selectedBranchId : null,
          overrideType: desired,
        });
      }

      setPendingByPermission({});
      await qc.invalidateQueries({ queryKey: ["rbac-overrides"] });
      toast.success("Đã lưu thay đổi phân quyền.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefault = async () => {
    if (!selectedRoleId) {
      toast.error("Bạn chưa chọn vai trò.");
      return;
    }
    if (scopeType !== "GLOBAL" && !selectedStoreId) {
      toast.error("Bạn chưa chọn cửa hàng.");
      return;
    }
    if (scopeType === "BRANCH" && !selectedBranchId) {
      toast.error("Bạn chưa chọn chi nhánh.");
      return;
    }
    if (scopedOverrides.length === 0) {
      toast.message("Phạm vi này đang dùng mặc định, không có gì để reset.");
      return;
    }

    setIsResetting(true);
    try {
      for (const row of scopedOverrides) {
        await deletePermissionOverride(row.overrideId);
      }
      setPendingByPermission({});
      await qc.invalidateQueries({ queryKey: ["rbac-overrides"] });
      toast.success("Đã reset về quyền mặc định.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setIsResetting(false);
    }
  };

  if (!canArea) return null;
  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Không có quyền quản lý phân quyền</CardTitle>
          <CardDescription>Tài khoản hiện tại không được phép sửa ma trận quyền.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (rolesQ.isPending || permissionsQ.isPending || storesQ.isPending) return <PageSkeleton cards={2} />;
  if (rolesQ.isError) return <ApiErrorState error={rolesQ.error} onRetry={() => void rolesQ.refetch()} />;
  if (permissionsQ.isError) return <ApiErrorState error={permissionsQ.error} onRetry={() => void permissionsQ.refetch()} />;
  if (storesQ.isError) return <ApiErrorState error={storesQ.error} onRetry={() => void storesQ.refetch()} />;
  if (overridesQ.isError) return <ApiErrorState error={overridesQ.error} onRetry={() => void overridesQ.refetch()} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân quyền theo vai trò</CardTitle>
          <CardDescription>
            Chọn vai trò bằng mô tả, chọn phạm vi cửa hàng/chi nhánh, tick quyền rồi bấm lưu. Reset mặc định sẽ xoá override của phạm vi đó.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <Label>Vai trò</Label>
            <select className={selectClass} value={scopeRoleId} onChange={(e) => setScopeRoleId(e.target.value)}>
              <option value="">Chọn vai trò</option>
              {(rolesQ.data?.content ?? []).map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {roleUiLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Phạm vi</Label>
            <select
              className={selectClass}
              value={scopeType}
              onChange={(e) => {
                const next = e.target.value as OverrideScope;
                setScopeType(next);
                if (next === "GLOBAL") {
                  setScopeStoreId("");
                  setScopeBranchId("");
                } else if (next === "STORE") {
                  setScopeBranchId("");
                }
              }}
            >
              <option value="GLOBAL">Toàn hệ thống</option>
              <option value="STORE">Theo cửa hàng</option>
              <option value="BRANCH">Theo chi nhánh</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Cửa hàng</Label>
            <select
              className={selectClass}
              value={scopeStoreId}
              disabled={scopeType === "GLOBAL"}
              onChange={(e) => {
                setScopeStoreId(e.target.value);
                setScopeBranchId("");
              }}
            >
              <option value="">Chọn cửa hàng</option>
              {(storesQ.data?.content ?? []).map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Chi nhánh</Label>
            <select
              className={selectClass}
              value={scopeBranchId}
              disabled={scopeType !== "BRANCH" || !scopeStoreId}
              onChange={(e) => setScopeBranchId(e.target.value)}
            >
              <option value="">Chọn chi nhánh</option>
              {(branchesQ.data?.content ?? []).map((b) => (
                <option key={b.branchId} value={String(b.branchId)}>
                  {b.branchName} ({b.branchCode})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" disabled={isSaving || isResetting || !hasPending} onClick={() => void saveChanges()}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <Button type="button" variant="outline" disabled={isSaving || isResetting} onClick={() => void resetDefault()}>
              {isResetting ? "Đang reset..." : "Reset mặc định"}
            </Button>
            {hasPending ? (
              <Button type="button" variant="ghost" onClick={() => setPendingByPermission({})}>
                Bỏ thay đổi tạm
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border px-3 py-2 text-sm">
              <p className="text-muted-foreground">Tổng quyền hiển thị</p>
              <p className="text-lg font-semibold">{permissionRows.length}</p>
            </div>
            <div className="rounded-md border px-3 py-2 text-sm">
              <p className="text-muted-foreground">Override trong phạm vi</p>
              <p className="text-lg font-semibold">{scopedOverrides.length}</p>
            </div>
            <div className="rounded-md border px-3 py-2 text-sm">
              <p className="text-muted-foreground">Thay đổi chờ lưu</p>
              <p className="text-lg font-semibold">{Object.keys(pendingByPermission).length}</p>
            </div>
            <div className="space-y-1">
              <Label>Tìm nhanh quyền</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên, mã, phân hệ..." />
            </div>
          </div>
        </CardHeader>
      </Card>

      {!scopeRoleId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Chọn vai trò để bắt đầu phân quyền.
          </CardContent>
        </Card>
      ) : (
        grouped.map(([module, rows]) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle className="text-base">{module}</CardTitle>
              <CardDescription>{rows.length} quyền trong phân hệ này.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tick</TableHead>
                    <TableHead>Tên quyền</TableHead>
                    <TableHead>Mã quyền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => {
                    const existing = overrideByPermission.get(p.id)?.[0];
                    const checked = Object.prototype.hasOwnProperty.call(pendingByPermission, p.id)
                      ? pendingByPermission[p.id]
                      : (existing?.overrideType ?? "").toUpperCase() === "ALLOW";
                    const pending = Object.prototype.hasOwnProperty.call(pendingByPermission, p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setPendingByPermission((prev) => ({ ...prev, [p.id]: next }));
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{p.permissionName}</TableCell>
                        <TableCell className="font-mono text-sm">{p.permissionCode}</TableCell>
                        <TableCell>
                          {pending ? (
                            <Badge variant="secondary">Sẽ {checked ? "cho phép" : "chặn"}</Badge>
                          ) : existing ? (
                            <Badge variant="outline">{overrideTypeLabel(existing.overrideType)}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Mặc định</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {scopeRoleId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Override hiện có trong phạm vi đang chọn</CardTitle>
            <CardDescription>Xoá từng dòng nếu bạn muốn bỏ override riêng lẻ.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã quyền</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedOverrides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Không có override nào trong phạm vi hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  scopedOverrides.map((o) => (
                    <TableRow key={o.overrideId}>
                      <TableCell className="font-mono text-sm">{o.permissionCode}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{overrideTypeLabel(o.overrideType)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.branchId != null
                          ? (branchNameById.get(o.branchId) ?? `Chi nhánh #${o.branchId}`)
                          : o.storeId != null
                            ? getStoreName(o.storeId)
                            : "Toàn hệ thống"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deleteM.isPending}
                          onClick={() => {
                            if (window.confirm("Xoá override này?")) deleteM.mutate(o.overrideId);
                          }}
                        >
                          Xoá
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
