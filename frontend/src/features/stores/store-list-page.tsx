import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateStoreCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { StoreFormDialog } from "@/features/stores/store-form-dialog";

const DEFAULT_SIZE = 10;

export function StoreListPage() {
  const location = useLocation();
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateStoreCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const [dialogOpen, setDialogOpen] = useState(false);

  const q = useQuery({
    queryKey: ["stores", "page", page, size],
    queryFn: () => fetchStoresPage({ page, size }),
  });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  if (q.isPending) return <PageSkeleton cards={3} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const data = q.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Danh sách cửa hàng</CardTitle>
            <CardDescription>Các cửa hàng trong phạm vi bạn được xem theo quy định hệ thống.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" onClick={() => setDialogOpen(true)}>
              Thêm cửa hàng
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
                  <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Chưa có cửa hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.storeCode}</TableCell>
                      <TableCell className="font-medium">{row.storeName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {formatDateTimeVi(row.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={`/app/cua-hang/${row.id}`}
                            state={{ from: `${location.pathname}${location.search}` }}
                          >
                            Mở
                          </Link>
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
        <StoreFormDialog
          mode="create"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => void q.refetch()}
        />
      ) : null}
    </div>
  );
}
