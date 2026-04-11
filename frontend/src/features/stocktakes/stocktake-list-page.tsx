import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchStocktakesPage } from "@/api/stocktakes-api";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateStocktakeCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { stocktakeStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";

const DEFAULT_SIZE = 10;
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StocktakeListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateStocktakeCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const storeFromUrl = params.get("cuaHang") ?? "";
  const statusFromUrl = params.get("trangThai") ?? "";
  const [dStore, setDStore] = useState(storeFromUrl);
  const [dSt, setDSt] = useState(statusFromUrl);
  const sk = params.toString();
  useEffect(() => {
    setDStore(params.get("cuaHang") ?? "");
    setDSt(params.get("trangThai") ?? "");
  }, [sk, params]);

  const storesQ = useQuery({
    queryKey: ["stk-list", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    retry: false,
  });

  const listQ = useQuery({
    queryKey: ["stocktakes", page, size, storeFromUrl, statusFromUrl],
    queryFn: () =>
      fetchStocktakesPage({
        page,
        size,
        ...(storeFromUrl ? { storeId: Number(storeFromUrl) } : {}),
        ...(statusFromUrl ? { status: statusFromUrl } : {}),
      }),
  });

  const apply = () => {
    const p = new URLSearchParams();
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    if (dStore) p.set("cuaHang", dStore);
    if (dSt) p.set("trangThai", dSt);
    setParams(p, { replace: true });
  };

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  if (listQ.isPending) return <PageSkeleton cards={2} />;
  if (listQ.isError) return <ApiErrorState error={listQ.error} onRetry={() => void listQ.refetch()} />;
  const data = listQ.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Kiểm kho</CardTitle>
            <CardDescription>Đối soát tồn thực tế tại một kho.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/app/kiem-kho/moi">Tạo phiếu kiểm</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Cửa hàng</Label>
            <select className={selectClass} value={dStore} onChange={(e) => setDStore(e.target.value)}>
              <option value="">Tất cả</option>
              {(storesQ.data?.content ?? []).map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <select className={selectClass} value={dSt} onChange={(e) => setDSt(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="draft">Bản nháp</option>
              <option value="completed">Đã chốt</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={apply}>
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Ngày kiểm</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Không có phiếu kiểm.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.stocktakeCode}</TableCell>
                      <TableCell className="text-sm">{formatDateTimeVi(row.stocktakeDate)}</TableCell>
                      <TableCell className="tabular-nums">{row.warehouseId}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stocktakeStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/kiem-kho/${row.id}`}>Mở</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={data} onPageChange={setPage} disabled={listQ.isFetching} />
        </CardContent>
      </Card>
    </div>
  );
}
