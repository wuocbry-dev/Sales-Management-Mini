import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { fetchSuppliersPage } from "@/api/suppliers-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupplierFormDialog } from "@/features/suppliers/supplier-form-dialog";
import { gateSupplierMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { activeInactiveLabel } from "@/lib/entity-status-labels";

const DEFAULT_SIZE = 10;

export function SupplierListPage() {
  const me = useAuthStore((s) => s.me);
  const canMutate = Boolean(me && gateSupplierMutate(me));
  const preferredStoreId = me?.defaultStoreId ?? me?.storeIds[0];
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["suppliers", page, size],
    queryFn: () => fetchSuppliersPage({ page, size }),
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
            <CardTitle className="text-lg">Nhà cung cấp</CardTitle>
            <CardDescription>Đối tác cung ứng hàng hóa.</CardDescription>
          </div>
          {canMutate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              Thêm nhà cung cấp
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
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Chưa có nhà cung cấp nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.supplierCode}</TableCell>
                      <TableCell className="font-medium">{row.supplierName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/nha-cung-cap/${row.id}`}>Mở</Link>
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
      {canMutate ? (
        <SupplierFormDialog
          mode="create"
          open={open}
          onOpenChange={setOpen}
          storeId={preferredStoreId}
          onSuccess={() => void q.refetch()}
        />
      ) : null}
    </div>
  );
}
