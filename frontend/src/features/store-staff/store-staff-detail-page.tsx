import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBranchesForStore } from "@/api/branches-api";
import {
  activateStoreStaff,
  changeStoreStaffBranch,
  fetchStoreStaffById,
  softDeactivateStoreStaff,
  updateStoreStaff,
} from "@/api/store-staff-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { roleCodeDescriptionVi } from "@/lib/role-labels";
import { useAuthStore } from "@/features/auth/auth-store";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import type { UpdateStoreStaffRequestBody } from "@/types/store-staff";

const selectClass =
  "flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const editSchema = z
  .object({
    fullName: z.string().min(1, "Bắt buộc").max(150),
    phone: z.string().max(20).optional(),
    email: z
      .string()
      .max(100)
      .optional()
      .refine((v) => !v?.trim() || /^[\w.+-]+@[\w.-]+\.[A-Za-z0-9-]{2,}$/.test(v.trim()), "Email không hợp lệ"),
    password: z.string().max(100).optional(),
  })
  .refine((d) => {
    const p = d.password?.trim() ?? "";
    return !p || p.length >= 6;
  }, { message: "Mật khẩu mới tối thiểu 6 ký tự", path: ["password"] });

type EditFormValues = z.infer<typeof editSchema>;

function isActiveStoreStaffStatus(status: string) {
  return status.trim().toUpperCase() === "ACTIVE";
}

export function StoreStaffDetailPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.me);
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

  const { getStoreName } = useStoreNameMap();

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "" },
  });

  useEffect(() => {
    const d = q.data;
    if (!d) return;
    editForm.reset({
      fullName: d.fullName,
      phone: d.phone ?? "",
      email: d.email ?? "",
      password: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đồng bộ khi dữ liệu từ server đổi
  }, [q.data]);

  const storeId = q.data?.storeId ?? 0;
  const branchesQ = useQuery({
    queryKey: ["branches", storeId, "staff-detail"],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 500 }),
    enabled: storeId > 0,
  });

  const updateM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (body: UpdateStoreStaffRequestBody) => updateStoreStaff(uid, body),
    onSuccess: async () => {
      toast.success("Đã cập nhật thông tin nhân viên.");
      editForm.setValue("password", "");
      await qc.invalidateQueries({ queryKey: ["store-staff"] });
      await qc.invalidateQueries({ queryKey: ["store-staff", uid] });
    },
    onError: (e) => {
      toast.error(formatApiError(e));
      applyApiFieldErrors(e, editForm.setError);
    },
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

  const deactivateM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => softDeactivateStoreStaff(uid),
    onSuccess: async () => {
      toast.success("Đã ngưng nhân viên (xóa mềm).");
      await qc.invalidateQueries({ queryKey: ["store-staff"] });
      await qc.invalidateQueries({ queryKey: ["store-staff", uid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const activateM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => activateStoreStaff(uid),
    onSuccess: async () => {
      toast.success("Đã mở hoạt động cho nhân viên.");
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
  const canDeactivate = Boolean(me && row.userId !== me.id && isActiveStoreStaffStatus(row.status));
  const canActivate = Boolean(me && row.userId !== me.id && !isActiveStoreStaffStatus(row.status));

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
        ← Quay lại
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
            <p className="text-xs font-medium text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{row.phone?.trim() ? row.phone : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm break-all">{row.email?.trim() ? row.email : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
            <p className="text-sm">{roleCodeDescriptionVi(row.roleCode)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cửa hàng</p>
            <p className="text-sm">{getStoreName(row.storeId)}</p>
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
          <CardTitle className="text-base">Cập nhật thông tin</CardTitle>
          <CardDescription>
            Sửa họ tên, liên hệ; mật khẩu để trống nếu không đổi. Tên đăng nhập không đổi tại đây.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...editForm}>
            <form
              className="space-y-4"
              onSubmit={editForm.handleSubmit((v) => {
                const pw = v.password?.trim();
                const body: UpdateStoreStaffRequestBody = {
                  fullName: v.fullName.trim(),
                  phone: v.phone?.trim() ? v.phone.trim() : null,
                  email: v.email?.trim() ? v.email.trim() : null,
                  password: pw ? pw : null,
                };
                updateM.mutate(body);
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điện thoại</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Mật khẩu mới (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="Để trống nếu không đổi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={updateM.isPending}>
                {updateM.isPending ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đổi chi nhánh làm việc</CardTitle>
          <CardDescription>Chỉ được chọn chi nhánh khác thuộc cùng cửa hàng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActiveStoreStaffStatus(row.status) ? (
            <p className="text-sm text-amber-800">
              Nhân viên đã ngưng hoạt động — không đổi chi nhánh được.
            </p>
          ) : branchesQ.isPending ? (
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

      {canDeactivate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ngưng nhân viên (xóa mềm)</CardTitle>
            <CardDescription>
              Đặt trạng thái ngưng hoạt động: không xóa dữ liệu, không đăng nhập được. Có thể lọc “Ngưng hoạt động”
              trong danh sách.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              disabled={deactivateM.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `Ngưng tài khoản "${row.username}"? Họ sẽ không đăng nhập được.`,
                  )
                ) {
                  return;
                }
                deactivateM.mutate();
              }}
            >
              {deactivateM.isPending ? "Đang xử lý…" : "Ngưng nhân viên"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canActivate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mở hoạt động nhân viên</CardTitle>
            <CardDescription>
              Kích hoạt lại tài khoản để nhân viên đăng nhập và thao tác bình thường.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="text-emerald-700 hover:bg-emerald-50"
              disabled={activateM.isPending}
              onClick={() => {
                if (!window.confirm(`Mở hoạt động lại cho tài khoản "${row.username}"?`)) {
                  return;
                }
                activateM.mutate();
              }}
            >
              {activateM.isPending ? "Đang xử lý…" : "Mở hoạt động"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
