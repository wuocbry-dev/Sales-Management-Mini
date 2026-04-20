import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchStockTransfersPage } from "@/api/stock-transfers-api";
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
import { useWarehouseNameMap } from "@/hooks/use-warehouse-name-map";
import { stockTransferStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";

const DEFAULT_SIZE = 10;
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function formatWarehouseDisplay(
  warehouseId: number,
  warehouseCode: string | null | undefined,
  warehouseName: string | null | undefined,
  getWarehouseName: (id: number) => string,
): string {
  const code = warehouseCode?.trim();
  const name = warehouseName?.trim();
  if (name && code) return `${name} (${code})`;
  if (name) return name;
  if (code) return code;
  return getWarehouseName(warehouseId);
}

type StockTransferCreateNavigationState = {
  from: string;
  defaults?: {
    storeId?: number;
    fromWarehouseId?: number;
    toWarehouseId?: number;
  };
};

function toPositiveInt(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

export function StockTransferListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateTransferCreate(me));
  const location = useLocation();
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

  const { warehouseOptions, getWarehouseName, isPending: whLoading } = useWarehouseNameMap({
    enabled: Boolean(me),
    fallbackStoreIds: me?.storeIds ?? [],
    includeStorePrefix: true,
  });

  const createNavState = useMemo<StockTransferCreateNavigationState>(() => {
    const returnTo = `${location.pathname}${location.search}`;
    const fromWarehouseId = toPositiveInt(dFrom);
    const toWarehouseId = toPositiveInt(dTo);

    const optionByWarehouseId = new Map(warehouseOptions.map((row) => [row.warehouseId, row]));
    const fromStoreId = fromWarehouseId ? optionByWarehouseId.get(fromWarehouseId)?.storeId : undefined;
    const toStoreId = toWarehouseId ? optionByWarehouseId.get(toWarehouseId)?.storeId : undefined;

    let inferredStoreId: number | undefined;
    if (fromStoreId && toStoreId) {
      if (fromStoreId === toStoreId) inferredStoreId = fromStoreId;
    } else {
      inferredStoreId = fromStoreId ?? toStoreId;
    }

    const defaults: StockTransferCreateNavigationState["defaults"] = {};
    if (inferredStoreId) defaults.storeId = inferredStoreId;
    if (fromWarehouseId) defaults.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) defaults.toWarehouseId = toWarehouseId;

    if (!defaults.storeId && !defaults.fromWarehouseId && !defaults.toWarehouseId) {
      return { from: returnTo };
    }
    return { from: returnTo, defaults };
  }, [dFrom, dTo, location.pathname, location.search, warehouseOptions]);

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
              <Link to="/app/chuyen-kho/moi" state={createNavState}>Tạo phiếu chuyển</Link>
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
                <option value={dFrom}>{getWarehouseName(Number(dFrom))} (không trong danh sách)</option>
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
                <option value={dTo}>{getWarehouseName(Number(dTo))} (không trong danh sách)</option>
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
                        {formatWarehouseDisplay(
                          row.fromWarehouseId,
                          row.fromWarehouseCode,
                          row.fromWarehouseName,
                          getWarehouseName,
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatWarehouseDisplay(
                          row.toWarehouseId,
                          row.toWarehouseCode,
                          row.toWarehouseName,
                          getWarehouseName,
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
