import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchStockTransfersPage } from "@/api/stock-transfers-api";
import { fetchStoresPage } from "@/api/stores-api";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateTransferCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { stockTransferStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import type { WarehouseResponse } from "@/types/warehouse";

const DEFAULT_SIZE = 10;
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function mergeWarehouseOptions(
  storeIds: number[],
  perStore: WarehouseResponse[][],
  storeNameById: Map<number, string>,
): { warehouseId: number; label: string }[] {
  const labelByWhId = new Map<number, string>();
  for (let i = 0; i < storeIds.length; i++) {
    const sid = storeIds[i];
    const list = perStore[i] ?? [];
    const prefix = storeIds.length > 1 ? `${storeNameById.get(sid) ?? `CH ${sid}`} — ` : "";
    for (const w of list) {
      if (!labelByWhId.has(w.warehouseId)) {
        labelByWhId.set(w.warehouseId, `${prefix}${w.warehouseName} (${w.warehouseCode})`);
      }
    }
  }
  return [...labelByWhId.entries()]
    .map(([warehouseId, label]) => ({ warehouseId, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi"));
}

export function StockTransferListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateTransferCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const fromUrl = params.get("tuKho") ?? "";
  const toUrl = params.get("denKho") ?? "";
  const stUrl = params.get("trangThai") ?? "";
  const [dFrom, setDFrom] = useState(fromUrl);
  const [dTo, setDTo] = useState(toUrl);
  const [dSt, setDSt] = useState(stUrl);
  const sk = params.toString();
  useEffect(() => {
    setDFrom(params.get("tuKho") ?? "");
    setDTo(params.get("denKho") ?? "");
    setDSt(params.get("trangThai") ?? "");
  }, [sk, params]);

  const listQ = useQuery({
    queryKey: ["stock-transfers", page, size, fromUrl, toUrl, stUrl],
    queryFn: () =>
      fetchStockTransfersPage({
        page,
        size,
        ...(fromUrl ? { fromWarehouseId: Number(fromUrl) } : {}),
        ...(toUrl ? { toWarehouseId: Number(toUrl) } : {}),
        ...(stUrl ? { status: stUrl } : {}),
      }),
  });

  const storeIds = me?.storeIds ?? [];
  const storesQ = useQuery({
    queryKey: ["stock-transfer-list", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    enabled: Boolean(me) && storeIds.length > 1,
  });

  const whQueries = useQueries({
    queries: storeIds.map((storeId) => ({
      queryKey: ["stock-transfer-list", "warehouses", storeId],
      queryFn: () => fetchWarehousesForStore(storeId),
      enabled: Boolean(me) && storeId > 0,
    })),
  });

  const warehouseOptions = useMemo(() => {
    const storeNameById = new Map<number, string>();
    const content = storesQ.data?.content;
    if (content) {
      for (const s of content) {
        if (storeIds.includes(s.id)) storeNameById.set(s.id, s.storeName);
      }
    }
    const perStore = whQueries.map((q) => q.data ?? []);
    return mergeWarehouseOptions(storeIds, perStore, storeNameById);
  }, [storeIds, storesQ.data, whQueries]);

  const whLabelById = useMemo(() => {
    const m = new Map<number, string>();
    for (const o of warehouseOptions) m.set(o.warehouseId, o.label);
    return m;
  }, [warehouseOptions]);

  const whLoading = whQueries.some((q) => q.isPending);

  const apply = () => {
    const p = new URLSearchParams();
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    if (dFrom.trim()) p.set("tuKho", dFrom.trim());
    if (dTo.trim()) p.set("denKho", dTo.trim());
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
            <CardTitle className="text-lg">Chuyển kho</CardTitle>
            <CardDescription>Chỉ trong cùng một cửa hàng.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/app/chuyen-kho/moi">Tạo phiếu chuyển</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Kho nguồn</Label>
            <select
              className={selectClass}
              disabled={whLoading || !me}
              value={dFrom}
              onChange={(e) => setDFrom(e.target.value)}
            >
              <option value="">Tất cả</option>
              {dFrom &&
              !warehouseOptions.some((o) => String(o.warehouseId) === dFrom) &&
              Number(dFrom) > 0 ? (
                <option value={dFrom}>Kho #{dFrom} (không trong danh sách)</option>
              ) : null}
              {warehouseOptions.map((o) => (
                <option key={o.warehouseId} value={String(o.warehouseId)}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Kho đích</Label>
            <select
              className={selectClass}
              disabled={whLoading || !me}
              value={dTo}
              onChange={(e) => setDTo(e.target.value)}
            >
              <option value="">Tất cả</option>
              {dTo &&
              !warehouseOptions.some((o) => String(o.warehouseId) === dTo) &&
              Number(dTo) > 0 ? (
                <option value={dTo}>Kho #{dTo} (không trong danh sách)</option>
              ) : null}
              {warehouseOptions.map((o) => (
                <option key={`to-${o.warehouseId}`} value={String(o.warehouseId)}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <select className={selectClass} value={dSt} onChange={(e) => setDSt(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="draft">Bản nháp</option>
              <option value="sent">Đang chuyển</option>
              <option value="completed">Đã nhận xong</option>
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
                  <TableHead>Ngày chuyển</TableHead>
                  <TableHead>Kho nguồn</TableHead>
                  <TableHead>Kho đích</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có phiếu chuyển.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.transferCode}</TableCell>
                      <TableCell className="text-sm">{formatDateTimeVi(row.transferDate)}</TableCell>
                      <TableCell className="text-sm">
                        {whLabelById.get(row.fromWarehouseId) ?? (
                          <span className="tabular-nums">{row.fromWarehouseId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {whLabelById.get(row.toWarehouseId) ?? (
                          <span className="tabular-nums">{row.toWarehouseId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stockTransferStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/chuyen-kho/${row.id}`}>Mở</Link>
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
