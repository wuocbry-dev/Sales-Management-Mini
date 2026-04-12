import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchRbacRolesPage } from "@/api/rbac-api";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { createSystemUser } from "@/api/users-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { roleUiLabel } from "@/lib/role-labels";
import type { CreateUserRequestBody } from "@/types/user-admin";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const schema = z
  .object({
    username: z.string().min(1, "Bắt buộc").max(50),
    email: z.string().min(1, "Bắt buộc").email("Email không hợp lệ").max(100),
    password: z.string().min(6, "Tối thiểu 6 ký tự").max(100),
    fullName: z.string().min(1, "Bắt buộc").max(150),
    phone: z.string().max(20).optional(),
    defaultStoreId: z.string().optional(),
    primaryStoreId: z.string().optional(),
    roleIds: z.array(z.number()).min(1, "Chọn ít nhất một vai trò"),
    storeIds: z.array(z.number()),
  })
  .superRefine((v, ctx) => {
    if (v.storeIds.length > 0 && v.primaryStoreId && v.primaryStoreId.trim() !== "") {
      const p = Number(v.primaryStoreId);
      if (!v.storeIds.includes(p)) {
        ctx.addIssue({ code: "custom", path: ["primaryStoreId"], message: "Cửa hàng chính phải nằm trong danh sách đã chọn." });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function toBody(v: FormValues): CreateUserRequestBody {
  const defaultStoreId =
    v.defaultStoreId == null || v.defaultStoreId.trim() === "" ? null : Number(v.defaultStoreId);
  const primaryRaw = v.primaryStoreId?.trim() ?? "";
  const primaryStoreId = primaryRaw === "" ? null : Number(primaryRaw);
  const phone = v.phone?.trim() ? v.phone.trim() : null;
  return {
    username: v.username.trim(),
    email: v.email.trim(),
    password: v.password,
    fullName: v.fullName.trim(),
    phone,
    defaultStoreId: Number.isFinite(Number(defaultStoreId)) ? Number(defaultStoreId) : null,
    roleIds: v.roleIds,
    storeIds: v.storeIds.length ? v.storeIds : [],
    primaryStoreId: primaryStoreId != null && Number.isFinite(primaryStoreId) ? primaryStoreId : null,
  };
}

export function SystemUserCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const rolesQ = useQuery({
    queryKey: ["rbac-roles", "all-create-user"],
    queryFn: () => fetchRbacRolesPage({ page: 0, size: 200 }),
  });

  const { stores, isPending: storesPending } = useStoreNameMap();

  const roles = rolesQ.data?.content ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      defaultStoreId: "",
      primaryStoreId: "",
      roleIds: [],
      storeIds: [],
    },
  });

  const selectedStores = form.watch("storeIds");

  const storeOptions = useMemo(() => stores.filter((s) => selectedStores.includes(s.id)), [stores, selectedStores]);

  const m = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (body: CreateUserRequestBody) => createSystemUser(body),
    onSuccess: async (d) => {
      toast.success("Đã tạo người dùng.");
      await qc.invalidateQueries({ queryKey: ["system-users"] });
      void navigate(`/app/nguoi-dung/${d.id}`);
    },
    onError: (e) => {
      toast.error(formatApiError(e));
      applyApiFieldErrors(e, form.setError);
    },
  });

  const toggleRole = (id: number, checked: boolean) => {
    const cur = form.getValues("roleIds");
    if (checked) form.setValue("roleIds", [...cur, id], { shouldValidate: true });
    else form.setValue(
      "roleIds",
      cur.filter((x) => x !== id),
      { shouldValidate: true },
    );
  };

  const toggleStore = (id: number, checked: boolean) => {
    const cur = form.getValues("storeIds");
    if (checked) form.setValue("storeIds", [...cur, id], { shouldValidate: true });
    else {
      form.setValue(
        "storeIds",
        cur.filter((x) => x !== id),
        { shouldValidate: true },
      );
      const prim = form.getValues("primaryStoreId");
      if (prim && Number(prim) === id) form.setValue("primaryStoreId", "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/nguoi-dung">← Quay lại</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm người dùng hệ thống</CardTitle>
          <CardDescription>Điền thông tin và phân quyền ban đầu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit((v) => {
                m.mutate(toBody(v));
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                  name="defaultStoreId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cửa hàng mặc định khi đăng nhập</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass}>
                          <option value="">Không chọn</option>
                          {stores.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.storeName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Vai trò</p>
                {rolesQ.isPending ? (
                  <p className="text-sm text-muted-foreground">Đang tải danh sách vai trò…</p>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có vai trò nào.</p>
                ) : (
                  <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                    {roles.map((r) => (
                      <label key={r.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-input"
                          checked={form.watch("roleIds").includes(r.id)}
                          onChange={(e) => toggleRole(r.id, e.target.checked)}
                        />
                        <span>
                          <span className="font-medium">{roleUiLabel(r)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="roleIds"
                  render={() => <FormMessage />}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cửa hàng được phép truy cập</p>
                <p className="text-xs text-muted-foreground">Có thể để trống nếu chưa cần gán cửa hàng.</p>
                {storesPending ? (
                  <p className="text-sm text-muted-foreground">Đang tải cửa hàng…</p>
                ) : (
                  <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                    {stores.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-input"
                          checked={form.watch("storeIds").includes(s.id)}
                          onChange={(e) => toggleStore(s.id, e.target.checked)}
                        />
                        <span>{s.storeName}</span>
                      </label>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="storeIds"
                  render={() => <FormMessage />}
                />
                {storeOptions.length > 0 ? (
                  <FormField
                    control={form.control}
                    name="primaryStoreId"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel>Cửa hàng chính</FormLabel>
                        <FormControl>
                          <select {...field} className={selectClass}>
                            <option value="">Không chọn</option>
                            {storeOptions.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.storeName}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={m.isPending}>
                  {m.isPending ? "Đang lưu…" : "Tạo người dùng"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/nguoi-dung">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
