import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { getMe, postRegister } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập").max(50, "Tối đa 50 ký tự"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(100),
  fullName: z.string().min(1, "Vui lòng nhập họ và tên").max(150),
  phone: z
    .string()
    .max(20, "Tối đa 20 ký tự")
    .transform((s) => s.trim())
    .transform((s) => (s === "" ? undefined : s)),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự").max(100),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setToken = useAuthStore((s) => s.setToken);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", fullName: "", phone: "", password: "" },
  });

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (values: FormValues) => {
      const auth = await postRegister({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        phone: values.phone ?? null,
      });
      setToken(auth.accessToken);
      try {
        const me = await getMe();
        return { token: auth.accessToken, me };
      } catch (e) {
        useAuthStore.getState().clearSession();
        throw e;
      }
    },
    onSuccess: ({ token, me }) => {
      setSession(token, me);
      toast.success("Đăng ký thành công.");
      navigate("/app/tong-quan", { replace: true });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>Điền thông tin để bắt đầu</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="reg-username">Tên đăng nhập</Label>
              <Input id="reg-username" autoComplete="username" {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-fullname">Họ và tên</Label>
              <Input id="reg-fullname" autoComplete="name" {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Số điện thoại (tuỳ chọn)</Label>
              <Input id="reg-phone" autoComplete="tel" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Mật khẩu</Label>
              <Input id="reg-password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo tài khoản…" : "Đăng ký"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
