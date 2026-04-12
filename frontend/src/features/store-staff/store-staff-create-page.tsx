import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBranchesForStore } from "@/api/branches-api";
import { createStoreStaff } from "@/api/store-staff-api";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { roleCodeDescriptionVi } from "@/lib/role-labels";
import type { CreateStoreStaffRequestBody } from "@/types/store-staff";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const schema = z.object({
  username: z.string().min(1, "Bắt buộc").max(50),
  password: z.string().min(6, "Tối thiểu 6 ký tự").max(100),
  fullName: z.string().min(1, "Bắt buộc").max(150),
  phone: z.string().max(20).optional(),
  email: z.string().max(100).optional(),
  roleCode: z.enum(["CASHIER", "WAREHOUSE_STAFF"]),
  branchId: z.string().min(1, "Chọn chi nhánh"),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export function StoreStaffCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const admin = Boolean(me && isSystemManage(me));

  const { stores: adminStores, getStoreName, isPending: adminStoresPending } = useStoreNameMap({
    enabled: Boolean(me),
  });

  const storeIdsForBranches = useMemo(() => {
    if (!me) return [];
    if (admin) return adminStores.map((s) => s.id);
    return me.storeIds ?? [];
  }, [me, admin, adminStores]);

  const branchesQueries = useQueries({
    queries: storeIdsForBranches.map((sid) => ({
      queryKey: ["branches", sid, "staff-create"],
      queryFn: () => fetchBranchesForStore(sid, { page: 0, size: 500 }),
      enabled: sid > 0,
    })),
  });

  const branchOptions = useMemo(() => {
    const rows: { branchId: number; label: string }[] = [];
    const seen = new Set<number>();
    for (const q of branchesQueries) {
      if (!q.data) continue;
      for (const b of q.data.content) {
        if (seen.has(b.branchId)) continue;
        seen.add(b.branchId);
        rows.push({
          branchId: b.branchId,
          label: `${b.branchName} (${b.branchCode}) — ${getStoreName(b.storeId)}`,
        });
      }
    }
    return rows.sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [branchesQueries]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      phone: "",
      email: "",
      roleCode: "CASHIER",
      branchId: "",
      status: "ACTIVE",
    },
  });

  const m = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (body: CreateStoreStaffRequestBody) => createStoreStaff(body),
    onSuccess: async (d) => {
      toast.success("Đã tạo nhân viên.");
      await qc.invalidateQueries({ queryKey: ["store-staff"] });
      void navigate(`/app/nhan-vien-cua-hang/${d.userId}`);
    },
    onError: (e) => {
      toast.error(formatApiError(e));
      applyApiFieldErrors(e, form.setError);
    },
  });

  const loadingBranches = branchesQueries.some((q) => q.isPending);

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/nhan-vien-cua-hang">← Quay lại</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Thêm nhân viên cửa hàng</CardTitle>
          <CardDescription>Chỉ được tạo thu ngân hoặc nhân viên kho tại chi nhánh thuộc phạm vi quản lý.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit((v) => {
                const emailTrim = v.email?.trim();
                m.mutate({
                  username: v.username.trim(),
                  password: v.password,
                  fullName: v.fullName.trim(),
                  phone: v.phone?.trim() ? v.phone.trim() : null,
                  email: emailTrim ? emailTrim : null,
                  roleCode: v.roleCode,
                  branchId: Number(v.branchId),
                  status: v.status,
                });
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu ban đầu</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điện thoại</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vai trò</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass}>
                          <option value="CASHIER">{roleCodeDescriptionVi("CASHIER")}</option>
                          <option value="WAREHOUSE_STAFF">{roleCodeDescriptionVi("WAREHOUSE_STAFF")}</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái ban đầu</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass}>
                          <option value="ACTIVE">Đang hoạt động</option>
                          <option value="INACTIVE">Ngưng hoạt động</option>
                          <option value="LOCKED">Đã khóa</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Chi nhánh làm việc</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass} disabled={loadingBranches || branchOptions.length === 0}>
                          <option value="">{loadingBranches ? "Đang tải…" : "Chọn chi nhánh"}</option>
                          {branchOptions.map((b) => (
                            <option key={b.branchId} value={String(b.branchId)}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {admin && adminStoresPending ? (
                <p className="text-sm text-muted-foreground">Đang tải danh sách cửa hàng…</p>
              ) : null}
              {!loadingBranches && branchOptions.length === 0 ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Không có chi nhánh khả dụng. Hãy kiểm tra bạn đã được gán cửa hàng hoặc đã có chi nhánh trong hệ thống.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={m.isPending || branchOptions.length === 0}>
                  {m.isPending ? "Đang lưu…" : "Tạo nhân viên"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/nhan-vien-cua-hang">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
