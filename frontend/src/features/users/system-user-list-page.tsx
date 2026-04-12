import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchSystemUsersPage } from "@/api/users-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatRoleCodesForUi } from "@/lib/role-labels";
import { gateSystemManage } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";

const DEFAULT_SIZE = 15;

export function SystemUserListPage() {
  const me = useAuthStore((s) => s.me);
  const canManage = Boolean(me && gateSystemManage(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const q = useQuery({
    queryKey: ["system-users", page, size],
    queryFn: () => fetchSystemUsersPage({ page, size }),
  });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const data = q.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Người dùng hệ thống</CardTitle>
            <CardDescription>Quản lý tài khoản toàn hệ thống (chỉ dành cho quản trị viên).</CardDescription>
          </div>
          {canManage ? (
            <Button type="button" asChild>
              <Link to="/app/nguoi-dung/moi">Thêm người dùng</Link>
            </Button>
          ) : null}
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
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      Chưa có người dùng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.username}</TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell className="text-sm">{row.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {formatRoleCodesForUi(row.roleCodes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{userAccountStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/nguoi-dung/${row.id}`}>Mở</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={data} onPageChange={setPage} disabled={q.isFetching} />
        </CardContent>
      </Card>
    </div>
  );
}
