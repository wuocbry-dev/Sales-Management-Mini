import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { fetchBranchesForStore } from "@/api/branches-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchFormDialog } from "@/features/branches/branch-form-dialog";
import { gateBranchCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { activeInactiveLabel, activeInactiveTextClass } from "@/lib/entity-status-labels";

const DEFAULT_SIZE = 10;

export function BranchListPage() {
  const { storeId: sid } = useParams();
  const storeId = Number(sid);
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateBranchCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["branches", storeId, page, size],
    queryFn: () => fetchBranchesForStore(storeId, { page, size }),
    enabled: Number.isFinite(storeId) && storeId > 0,
  });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  if (!Number.isFinite(storeId) || storeId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu thông tin cửa hàng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const data = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/cua-hang/${storeId}`}>← Cửa hàng</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Chi nhánh</CardTitle>
            <CardDescription>Danh sách chi nhánh thuộc cửa hàng đang chọn.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              Thêm chi nhánh
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Chưa có chi nhánh nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.branchId}>
                      <TableCell className="font-mono text-sm">{row.branchCode}</TableCell>
                      <TableCell className="font-medium">{row.branchName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={activeInactiveTextClass(row.status)}>{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/cua-hang/${storeId}/chi-nhanh/${row.branchId}`}>Mở</Link>
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

      {canCreate ? (
        <BranchFormDialog mode="create" storeId={storeId} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} />
      ) : null}
    </div>
  );
}
