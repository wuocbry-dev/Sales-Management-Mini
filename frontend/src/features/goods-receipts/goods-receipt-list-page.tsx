import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchGoodsReceiptsPage } from "@/api/goods-receipts-api";
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
import { gateGoodsReceiptCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { datetimeLocalToBackend } from "@/lib/datetime-local-to-backend";
import { goodsReceiptStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatVndFromDecimal } from "@/lib/format-vnd";

const DEFAULT_SIZE = 10;
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function GoodsReceiptListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateGoodsReceiptCreate(me));
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const storeFromUrl = params.get("cuaHang") ?? "";
  const statusFromUrl = params.get("trangThai") ?? "";
  const fromUrl = params.get("tuNgay") ?? "";
  const toUrl = params.get("denNgay") ?? "";

  const [draftStore, setDraftStore] = useState(storeFromUrl);
  const [draftStatus, setDraftStatus] = useState(statusFromUrl);
  const [draftFrom, setDraftFrom] = useState(fromUrl);
  const [draftTo, setDraftTo] = useState(toUrl);

  const searchKey = params.toString();
  useEffect(() => {
    setDraftStore(params.get("cuaHang") ?? "");
    setDraftStatus(params.get("trangThai") ?? "");
    setDraftFrom(params.get("tuNgay") ?? "");
    setDraftTo(params.get("denNgay") ?? "");
  }, [searchKey, params]);

  const storesQ = useQuery({
    queryKey: ["goods-receipt-filters", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    retry: false,
  });

  const storeIdNum = storeFromUrl === "" ? undefined : Number(storeFromUrl);
  const listQ = useQuery({
    queryKey: ["goods-receipts", page, size, storeFromUrl, statusFromUrl, fromUrl, toUrl],
    queryFn: () =>
      fetchGoodsReceiptsPage({
        page,
        size,
        ...(storeIdNum != null && Number.isFinite(storeIdNum) && storeIdNum > 0 ? { storeId: storeIdNum } : {}),
        ...(statusFromUrl ? { status: statusFromUrl } : {}),
        ...(fromUrl ? { fromReceiptDate: datetimeLocalToBackend(fromUrl) } : {}),
        ...(toUrl ? { toReceiptDate: datetimeLocalToBackend(toUrl) } : {}),
      }),
  });

  const apply = () => {
    const p = new URLSearchParams();
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    if (draftStore) p.set("cuaHang", draftStore);
    if (draftStatus) p.set("trangThai", draftStatus);
    if (draftFrom) p.set("tuNgay", draftFrom);
    if (draftTo) p.set("denNgay", draftTo);
    setParams(p, { replace: true });
  };

  const reset = () => {
    setDraftStore("");
    setDraftStatus("");
    setDraftFrom("");
    setDraftTo("");
    setParams(new URLSearchParams({ trang: "0", kichThuoc: String(size) }), { replace: true });
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
  const storeOpts = storesQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Phiếu nhập</CardTitle>
            <CardDescription>Nhập hàng từ nhà cung cấp vào kho.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link
                to="/app/phieu-nhap/moi"
                state={{
                  from: `${location.pathname}${location.search}`,
                  ...(Number(draftStore) > 0
                    ? { defaults: { storeId: Number(draftStore) } }
                    : {}),
                }}
              >
                Tạo phiếu nhập
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Cửa hàng</Label>
              <select className={selectClass} value={draftStore} onChange={(e) => setDraftStore(e.target.value)} disabled={storesQ.isError}>
                <option value="">Tất cả</option>
                {storeOpts.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select className={selectClass} value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="draft">Bản nháp</option>
                <option value="completed">Đã nhập kho</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Từ ngày giờ</Label>
              <Input type="datetime-local" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Đến ngày giờ</Label>
              <Input type="datetime-local" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={apply}>
              Áp dụng bộ lọc
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Không có phiếu nhập.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.receiptCode}</TableCell>
                      <TableCell className="text-sm">{formatDateTimeVi(row.receiptDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{goodsReceiptStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVndFromDecimal(row.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/phieu-nhap/${row.id}`}>Mở</Link>
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
