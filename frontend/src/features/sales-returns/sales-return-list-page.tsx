import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchSalesOrderById } from "@/api/sales-orders-api";
import { fetchSalesReturnsPage } from "@/api/sales-returns-api";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateReturnCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { salesReturnStatusLabel } from "@/lib/document-flow-labels";

const DEFAULT_SIZE = 10;
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function SalesReturnListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateReturnCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const storeFromUrl = params.get("cuaHang") ?? "";
  const orderFromUrl = params.get("donHang") ?? "";
  const statusFromUrl = params.get("trangThai") ?? "";

  const [dStore, setDStore] = useState(storeFromUrl);
  const [dOrder, setDOrder] = useState(orderFromUrl);
  const [dStatus, setDStatus] = useState(statusFromUrl);
  const sk = params.toString();
  useEffect(() => {
    setDStore(params.get("cuaHang") ?? "");
    setDOrder(params.get("donHang") ?? "");
    setDStatus(params.get("trangThai") ?? "");
  }, [sk, params]);

  const storesQ = useQuery({
    queryKey: ["sr-list", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    retry: false,
  });

  const listQ = useQuery({
    queryKey: ["sales-returns", page, size, storeFromUrl, orderFromUrl, statusFromUrl],
    queryFn: () =>
      fetchSalesReturnsPage({
        page,
        size,
        ...(storeFromUrl ? { storeId: Number(storeFromUrl) } : {}),
        ...(orderFromUrl ? { orderId: Number(orderFromUrl) } : {}),
        ...(statusFromUrl ? { status: statusFromUrl } : {}),
      }),
  });

  const orderIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of listQ.data?.content ?? []) {
      if (row.orderId > 0) ids.add(row.orderId);
    }
    return [...ids];
  }, [listQ.data?.content]);

  const orderQueries = useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: ["sales-orders", orderId],
      queryFn: () => fetchSalesOrderById(orderId),
      enabled: orderId > 0,
      retry: false,
    })),
  });

  const orderCodeById = useMemo(() => {
    const map = new Map<number, string>();
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const order = orderQueries[i]?.data;
      if (order?.orderCode) {
        map.set(orderId, order.orderCode);
      }
    }
    return map;
  }, [orderIds, orderQueries]);

  const apply = () => {
    const p = new URLSearchParams();
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    if (dStore) p.set("cuaHang", dStore);
    if (dOrder.trim()) p.set("donHang", dOrder.trim());
    if (dStatus) p.set("trangThai", dStatus);
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
            <CardTitle className="text-lg">Trả hàng</CardTitle>
            <CardDescription>Phiếu trả liên quan đơn đã hoàn tất.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/app/tra-hang/moi">Tạo phiếu trả</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
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
            <Label>Mã đơn (số)</Label>
            <Input value={dOrder} onChange={(e) => setDOrder(e.target.value)} placeholder="Tuỳ chọn" inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <select className={selectClass} value={dStatus} onChange={(e) => setDStatus(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="draft">Bản nháp</option>
              <option value="completed">Đã hoàn tất</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <Button type="button" onClick={apply}>
              Áp dụng bộ lọc
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
                  <TableHead>Đơn gốc</TableHead>
                  <TableHead>Ngày trả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hoàn tiền</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có phiếu trả.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.returnCode}</TableCell>
                      <TableCell className="text-sm">{orderCodeById.get(row.orderId) ?? `Đơn #${row.orderId}`}</TableCell>
                      <TableCell className="text-sm">{formatDateTimeVi(row.returnDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{salesReturnStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVndFromDecimal(row.refundAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/tra-hang/${row.id}`}>Mở</Link>
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
