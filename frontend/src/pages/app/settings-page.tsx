import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { postChangePassword } from "@/api/auth-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/auth-store";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatRoleCodesForUi } from "@/lib/role-labels";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới tối thiểu 6 ký tự.")
      .max(100, "Mật khẩu mới tối đa 100 ký tự."),
    confirmNewPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmNewPassword"],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    path: ["newPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const me = useAuthStore((s) => s.me);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const changePasswordM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (values: { currentPassword: string; newPassword: string }) => postChangePassword(values),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công.");
      form.reset();
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError)) {
        toast.error(formatApiError(e));
      }
    },
  });

  if (!me) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hồ sơ tài khoản</CardTitle>
          <CardDescription>Thông tin phiên đăng nhập hiện tại của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tên đăng nhập</p>
            <p className="font-mono text-sm">{me.username}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Họ tên</p>
            <p className="text-sm font-medium">{me.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{me.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{me.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary">{userAccountStatusLabel(me.status)}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cửa hàng mặc định</p>
            <p className="text-sm">{me.defaultStoreId != null ? me.defaultStoreId : "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
            <p className="text-sm">{formatRoleCodesForUi(me.roles)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu hiện tại, sau đó đặt mật khẩu mới để bảo mật tài khoản.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-4 sm:max-w-xl"
              onSubmit={form.handleSubmit((values) => {
                changePasswordM.mutate({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                });
              })}
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={changePasswordM.isPending}>
                  {changePasswordM.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
