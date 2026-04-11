import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_ME_QUERY_KEY } from "@/app/auth-query-keys";
import { resolveDefaultLandingPath } from "@/app/default-landing";
import { getMe, postLogin } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import { queryClient } from "@/lib/query-client";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setToken = useAuthStore((s) => s.setToken);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (values: FormValues) => {
      const auth = await postLogin({
        username: values.username.trim(),
        password: values.password,
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
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, me);
      toast.success("Đăng nhập thành công.");
      navigate(resolveDefaultLandingPath(me), { replace: true });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Nhập tài khoản để vào phần quản trị</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Email hoặc tên đăng nhập</Label>
              <Input id="username" autoComplete="username" {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
