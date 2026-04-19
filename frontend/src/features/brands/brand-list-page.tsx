import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { deleteBrand, fetchBrandsPage } from "@/api/brands-api";
import { toast } from "sonner";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrandFormDialog } from "@/features/brands/brand-form-dialog";
import { gateProductCatalogMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import {
  activeInactiveLabel,
  activeInactiveTextClass,
  softDeleteToggleConfirmVerb,
  softDeleteToggleLabel,
  softDeleteToggleLoadingLabel,
  softDeleteToggleSuccessVerb,
} from "@/lib/entity-status-labels";
import type { BrandResponse } from "@/types/master-data";

const DEFAULT_SIZE = 10;

export function BrandListPage() {
  const me = useAuthStore((s) => s.me);
  const queryClient = useQueryClient();
  const canMutate = Boolean(me && gateProductCatalogMutate(me));
  const preferredStoreId = me?.defaultStoreId ?? me?.storeIds[0];
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandResponse | null>(null);

  const deleteM = useMutation({
    mutationFn: async (args: { brandId: number; status: string }) => deleteBrand(args.brandId),
    onSuccess: async (_data, variables) => {
      toast.success(`Đã ${softDeleteToggleSuccessVerb(variables.status)} thương hiệu.`);
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });
  const deletingBrandId = deleteM.isPending ? deleteM.variables?.brandId ?? null : null;

  const q = useQuery({
    queryKey: ["brands", page, size],
    queryFn: () => fetchBrandsPage({ page, size }),
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
            <CardTitle className="text-lg">Thương hiệu</CardTitle>
            <CardDescription>Danh sách thương hiệu hàng hóa.</CardDescription>
          </div>
          {canMutate ? (
            <Button type="button" onClick={() => setOpen(true)}>
              Thêm thương hiệu
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
                  <TableHead className="w-[220px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Chưa có thương hiệu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.brandCode}</TableCell>
                      <TableCell className="font-medium">{row.brandName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={activeInactiveTextClass(row.status)}>{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/app/thuong-hieu/${row.id}`}>Mở</Link>
                          </Button>
                          {canMutate ? (
                            <Button variant="secondary" size="sm" type="button" onClick={() => setEditing(row)}>
                              Sửa
                            </Button>
                          ) : null}
                          {canMutate ? (
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className={row.status === "INACTIVE" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                              disabled={deletingBrandId === row.id}
                              onClick={() => {
                                const action = softDeleteToggleConfirmVerb(row.status);
                                if (!window.confirm(`${action} thương hiệu \"${row.brandName}\"?`)) {
                                  return;
                                }
                                deleteM.mutate({ brandId: row.id, status: row.status });
                              }}
                            >
                              {deletingBrandId === row.id ? softDeleteToggleLoadingLabel(row.status) : softDeleteToggleLabel(row.status)}
                            </Button>
                          ) : null}
                        </div>
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
        <BrandFormDialog
          mode="create"
          open={open}
          onOpenChange={setOpen}
          storeId={preferredStoreId}
          onSuccess={() => void q.refetch()}
        />
      ) : null}
      {canMutate && editing ? (
        <BrandFormDialog
          mode="edit"
          brand={editing}
          open={Boolean(editing)}
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
          onSuccess={() => void q.refetch()}
        />
      ) : null}
    </div>
  );
}
