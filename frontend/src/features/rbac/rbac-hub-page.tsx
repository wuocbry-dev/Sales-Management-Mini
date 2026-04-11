import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createPermissionOverride,
  deletePermissionOverride,
  fetchPermissionOverrides,
  fetchRbacPermissionsPage,
  fetchRbacRolesPage,
} from "@/api/rbac-api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  gateRbacAreaRoute,
  gateRbacOverridesManage,
  gateRbacPermissionsView,
  gateRbacRolesView,
} from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import type { CreatePermissionOverrideRequestBody } from "@/types/rbac";

type Tab = "roles" | "permissions" | "overrides";

const DEFAULT_SIZE = 15;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function overrideTypeLabel(t: string): string {
  const u = (t ?? "").toUpperCase();
  if (u === "ALLOW") return "Cho phép thêm";
  if (u === "DENY") return "Chặn";
  return t || "—";
}

export function RbacHubPage() {
  const me = useAuthStore((s) => s.me);
  const canArea = Boolean(me && gateRbacAreaRoute(me));
  const canRoles = Boolean(me && gateRbacRolesView(me));
  const canPerms = Boolean(me && gateRbacPermissionsView(me));
  const canOverrides = Boolean(me && gateRbacOverridesManage(me));

  const initialTab = useMemo((): Tab => {
    if (canRoles) return "roles";
    if (canPerms) return "permissions";
    return "overrides";
  }, [canRoles, canPerms]);

  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const rolesQ = useQuery({
    queryKey: ["rbac-roles", page, size],
    queryFn: () => fetchRbacRolesPage({ page, size }),
    enabled: canArea && tab === "roles" && canRoles,
  });

  const permsQ = useQuery({
    queryKey: ["rbac-permissions", page, size],
    queryFn: () => fetchRbacPermissionsPage({ page, size }),
    enabled: canArea && tab === "permissions" && canPerms,
  });

  const filterRoleId = params.get("roleGhiDe");
  const overrideRoleFilter = filterRoleId && filterRoleId !== "" ? Number(filterRoleId) : undefined;

  const overridesQ = useQuery({
    queryKey: ["rbac-overrides", overrideRoleFilter],
    queryFn: () => fetchPermissionOverrides(overrideRoleFilter),
    enabled: canArea && tab === "overrides" && canOverrides,
  });

  const rolesForForm = useQuery({
    queryKey: ["rbac-roles", "form"],
    queryFn: () => fetchRbacRolesPage({ page: 0, size: 200 }),
    enabled: canArea && canOverrides,
  });

  const permsForForm = useQuery({
    queryKey: ["rbac-permissions", "form"],
    queryFn: () => fetchRbacPermissionsPage({ page: 0, size: 200 }),
    enabled: canArea && canOverrides,
  });

  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formRoleId, setFormRoleId] = useState<string>("");
  const [formPermId, setFormPermId] = useState<string>("");
  const [formStoreId, setFormStoreId] = useState<string>("");
  const [formBranchId, setFormBranchId] = useState<string>("");
  const [formType, setFormType] = useState<string>("ALLOW");

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  const createM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (body: CreatePermissionOverrideRequestBody) => createPermissionOverride(body),
    onSuccess: async () => {
      toast.success("Đã thêm ghi đè phân quyền.");
      setCreateOpen(false);
      await qc.invalidateQueries({ queryKey: ["rbac-overrides"] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const deleteM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (id: number) => deletePermissionOverride(id),
    onSuccess: async () => {
      toast.success("Đã xoá ghi đè.");
      await qc.invalidateQueries({ queryKey: ["rbac-overrides"] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (!canArea) return null;

  const tabBtn = (t: Tab, label: string) => (
    <Button
      type="button"
      variant={tab === t ? "default" : "outline"}
      size="sm"
      className={cn(tab === t ? "" : "bg-background")}
      onClick={() => {
        setTab(t);
        const p = new URLSearchParams(params);
        p.set("trang", "0");
        setParams(p, { replace: true });
      }}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân quyền hệ thống</CardTitle>
          <CardDescription>Danh mục vai trò, quyền và ghi đè theo phạm vi được cấp.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canRoles ? tabBtn("roles", "Vai trò") : null}
          {canPerms ? tabBtn("permissions", "Quyền") : null}
          {canOverrides ? tabBtn("overrides", "Ghi đè phân quyền") : null}
        </CardContent>
      </Card>

      {tab === "roles" && canRoles ? (
        rolesQ.isPending ? (
          <PageSkeleton cards={1} />
        ) : rolesQ.isError ? (
          <ApiErrorState error={rolesQ.error} onRetry={() => void rolesQ.refetch()} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách vai trò</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã vai trò</TableHead>
                      <TableHead>Tên hiển thị</TableHead>
                      <TableHead>Mô tả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rolesQ.data.content.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          Không có dữ liệu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rolesQ.data.content.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.roleCode}</TableCell>
                          <TableCell className="font-medium">{r.roleName}</TableCell>
                          <TableCell className="max-w-md text-sm text-muted-foreground">{r.description ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar page={rolesQ.data} onPageChange={setPage} disabled={rolesQ.isFetching} />
            </CardContent>
          </Card>
        )
      ) : null}

      {tab === "permissions" && canPerms ? (
        permsQ.isPending ? (
          <PageSkeleton cards={1} />
        ) : permsQ.isError ? (
          <ApiErrorState error={permsQ.error} onRetry={() => void permsQ.refetch()} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách quyền</CardTitle>
              <CardDescription>Mã quyền là định danh nghiệp vụ trong hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã quyền</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Phân hệ</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permsQ.data.content.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Không có dữ liệu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      permsQ.data.content.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.permissionCode}</TableCell>
                          <TableCell>{r.permissionName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.moduleName ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.actionName ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar page={permsQ.data} onPageChange={setPage} disabled={permsQ.isFetching} />
            </CardContent>
          </Card>
        )
      ) : null}

      {tab === "overrides" && canOverrides ? (
        overridesQ.isPending ? (
          <PageSkeleton cards={1} />
        ) : overridesQ.isError ? (
          <ApiErrorState error={overridesQ.error} onRetry={() => void overridesQ.refetch()} />
        ) : (
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Ghi đè phân quyền</CardTitle>
                <CardDescription>Áp dụng cho vai trò, có thể giới hạn theo cửa hàng hoặc chi nhánh.</CardDescription>
              </div>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Thêm ghi đè
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label>Lọc theo vai trò</Label>
                  <select
                    className={selectClass + " min-w-[220px]"}
                    value={filterRoleId ?? ""}
                    onChange={(e) => {
                      const p = new URLSearchParams(params);
                      if (e.target.value) p.set("roleGhiDe", e.target.value);
                      else p.delete("roleGhiDe");
                      setParams(p, { replace: true });
                    }}
                  >
                    <option value="">Tất cả</option>
                    {(rolesForForm.data?.content ?? []).map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.roleName} ({r.roleCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Mã quyền</TableHead>
                      <TableHead>Phạm vi</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overridesQ.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Chưa có ghi đè nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      overridesQ.data.map((o) => (
                        <TableRow key={o.overrideId}>
                          <TableCell>{o.roleId}</TableCell>
                          <TableCell className="font-mono text-sm">{o.permissionCode}</TableCell>
                          <TableCell className="text-sm">
                            {o.branchId != null
                              ? `Chi nhánh ${o.branchId}`
                              : o.storeId != null
                                ? `Cửa hàng ${o.storeId}`
                                : "Toàn hệ thống"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{overrideTypeLabel(o.overrideType)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deleteM.isPending}
                              onClick={() => {
                                if (window.confirm("Xoá ghi đè này?")) deleteM.mutate(o.overrideId);
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
              </div>
            </CardContent>
          </Card>
        )
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm ghi đè phân quyền</DialogTitle>
            <DialogDescription>Chọn vai trò, quyền và loại ghi đè. Cửa hàng và chi nhánh là tuỳ chọn.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Vai trò</Label>
              <select className={selectClass} value={formRoleId} onChange={(e) => setFormRoleId(e.target.value)}>
                <option value="">Chọn</option>
                {(rolesForForm.data?.content ?? []).map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Quyền</Label>
              <select className={selectClass} value={formPermId} onChange={(e) => setFormPermId(e.target.value)}>
                <option value="">Chọn</option>
                {(permsForForm.data?.content ?? []).map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.permissionCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Loại ghi đè</Label>
              <select className={selectClass} value={formType} onChange={(e) => setFormType(e.target.value)}>
                <option value="ALLOW">Cho phép thêm</option>
                <option value="DENY">Chặn</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Mã cửa hàng (tuỳ chọn)</Label>
              <Input inputMode="numeric" value={formStoreId} onChange={(e) => setFormStoreId(e.target.value)} placeholder="Để trống nếu không giới hạn" />
            </div>
            <div className="space-y-1">
              <Label>Mã chi nhánh (tuỳ chọn)</Label>
              <Input inputMode="numeric" value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)} placeholder="Nếu có, hệ thống sẽ gắn đúng cửa hàng" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button
              type="button"
              disabled={createM.isPending || !formRoleId || !formPermId}
              onClick={() => {
                const storeId = formStoreId.trim() === "" ? null : Number(formStoreId);
                const branchId = formBranchId.trim() === "" ? null : Number(formBranchId);
                createM.mutate({
                  roleId: Number(formRoleId),
                  permissionId: Number(formPermId),
                  storeId: storeId != null && Number.isFinite(storeId) ? storeId : null,
                  branchId: branchId != null && Number.isFinite(branchId) ? branchId : null,
                  overrideType: formType,
                });
              }}
            >
              {createM.isPending ? "Đang lưu…" : "Tạo ghi đè"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
