import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  fetchInventoriesByStore,
  fetchInventoriesByWarehouse,
  fetchInventoryAvailability,
  fetchInventoryTransactionsPage,
} from "@/api/inventory-api";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { useWarehouseNameMap } from "@/hooks/use-warehouse-name-map";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/auth-store";
import { gateInventoryTransactionView } from "@/features/auth/gates";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { inventoryTransactionTypeLabel } from "@/lib/inventory-transaction-type-labels";
import { warehouseTypeLabel } from "@/lib/warehouse-type-labels";
const DEFAULT_SIZE = 10;

/** Hiển thị biến thể: `SKU · tên` (fallback id nếu thiếu dữ liệu). */
function formatInventoryVariantLabel(row: {
  variantId: number;
  variantSku?: string | null;
  variantName?: string | null;
}) {
  const sku = row.variantSku?.trim() ?? "";
  const name = row.variantName?.trim() ?? "";
  if (sku && name) return `${sku} · ${name}`;
  if (sku) return sku;
  if (name) return name;
  return `#${row.variantId}`;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const TXN_TYPES = [
  "OPENING",
  "PURCHASE",
  "SALE",
  "SALE_RETURN",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "STOCKTAKE_ADJUST",
  "MANUAL_ADJUST",
] as const;

type TabId = "by_wh" | "by_store" | "availability" | "transactions";

export type InventoryOverviewPageProps = {
  /** Mở thẳng tab biến động cho điều hướng nội bộ. */
  initialTab?: TabId;
};

export function InventoryOverviewPage(props: InventoryOverviewPageProps = {}) {
  const { initialTab } = props;
  const me = useAuthStore((s) => s.me);
  const canSeeTransactionsTab = Boolean(me && gateInventoryTransactionView(me));
  const [tab, setTab] = useState<TabId>(initialTab ?? "by_wh");

  useEffect(() => {
    if (tab === "transactions" && !canSeeTransactionsTab) {
      setTab("by_wh");
    }
  }, [tab, canSeeTransactionsTab]);

  const [storeId, setStoreId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(0);

  const [whPage, setWhPage] = useState(0);
  const [storeInvPage, setStoreInvPage] = useState(0);
  const [txnPage, setTxnPage] = useState(0);

  const [availStoreId, setAvailStoreId] = useState<number>(0);
  const [availVariantPick, setAvailVariantPick] = useState(0);
  const [availSubmitted, setAvailSubmitted] = useState<{ storeId: number; variantId: number } | null>(null);

  const [txnType, setTxnType] = useState("");
  const [txnVariantPick, setTxnVariantPick] = useState(0);
  const [txnFrom, setTxnFrom] = useState("");
  const [txnTo, setTxnTo] = useState("");

  const {
    stores: storeOptions,
    getStoreName,
    isPending: storesLoading,
    isError: storesLoadError,
    error: storesLoadErr,
    refetch: refetchStores,
  } = useStoreNameMap();

  const fallbackStoreIds = me?.storeIds ?? [];

  const warehousesQ = useQuery({
    queryKey: ["inventory", "warehouses", storeId],
    queryFn: () => fetchWarehousesForStore(storeId),
    enabled: storeId > 0,
  });
  const warehousesSorted = useMemo(() => {
    const list = warehousesQ.data ?? [];
    return [...list].sort((a, b) => {
      if (a.warehouseType === b.warehouseType) return a.warehouseName.localeCompare(b.warehouseName, "vi");
      if (a.warehouseType === "CENTRAL") return -1;
      if (b.warehouseType === "CENTRAL") return 1;
      return 0;
    });
  }, [warehousesQ.data]);

  const { getWarehouseName } = useWarehouseNameMap({
    enabled: storeId > 0,
    storeIds: storeId > 0 ? [storeId] : [],
    includeStorePrefix: false,
  });

  const invByWhQ = useQuery({
    queryKey: ["inventory", "by-warehouse", warehouseId, whPage, DEFAULT_SIZE],
    queryFn: () => fetchInventoriesByWarehouse(warehouseId, { page: whPage, size: DEFAULT_SIZE }),
    enabled: tab === "by_wh" && warehouseId > 0,
  });

  const invByStoreQ = useQuery({
    queryKey: ["inventory", "by-store", storeId, storeInvPage, DEFAULT_SIZE],
    queryFn: () => fetchInventoriesByStore(storeId, { page: storeInvPage, size: DEFAULT_SIZE }),
    enabled: tab === "by_store" && storeId > 0,
  });

  const availabilityQ = useQuery({
    queryKey: ["inventory", "availability", availSubmitted?.storeId, availSubmitted?.variantId],
    queryFn: () => fetchInventoryAvailability(availSubmitted!.storeId, availSubmitted!.variantId),
    enabled: Boolean(availSubmitted),
  });

  useEffect(() => {
    setAvailVariantPick(0);
    setAvailSubmitted(null);
  }, [availStoreId]);

  useEffect(() => {
    setTxnVariantPick(0);
  }, [storeId]);

  const txnParams = useMemo(() => {
    const vid = txnVariantPick > 0 ? txnVariantPick : undefined;
    const fromIso =
      txnFrom.trim() === ""
        ? undefined
        : (() => {
            const d = new Date(txnFrom);
            return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
          })();
    const toIso =
      txnTo.trim() === ""
        ? undefined
        : (() => {
            const d = new Date(txnTo);
            return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
          })();
    return {
      transactionType: txnType || undefined,
      variantId: vid,
      fromCreatedAt: fromIso,
      toCreatedAt: toIso,
    };
  }, [txnType, txnVariantPick, txnFrom, txnTo]);

  const txnQ = useQuery({
    queryKey: ["inventory", "transactions", warehouseId, txnPage, DEFAULT_SIZE, txnParams],
    queryFn: () =>
      fetchInventoryTransactionsPage({
        warehouseId,
        page: txnPage,
        size: DEFAULT_SIZE,
        ...txnParams,
      }),
    enabled: tab === "transactions" && warehouseId > 0,
  });

  const tabs: { id: TabId; label: string; hint: string }[] = useMemo(() => {
    const all: { id: TabId; label: string; hint: string }[] = [
      { id: "by_wh", label: "Tồn theo kho", hint: "Chi tiết từng dòng tồn trong một kho cụ thể." },
      { id: "by_store", label: "Tồn gộp cửa hàng", hint: "Gộp mọi kho thuộc cửa hàng (theo cùng một mã biến thể có thể xuất hiện nhiều dòng)." },
      {
        id: "availability",
        label: "Khả dụng theo kho",
        hint: "Xem số lượng cùng một biến thể tại từng kho trong cửa hàng (tìm theo SKU hoặc tên biến thể).",
      },
      {
        id: "transactions",
        label: "Biến động tồn",
        hint: "Nhật ký xuất nhập tại một kho, có thể lọc theo loại, biến thể và thời gian.",
      },
    ];
    return canSeeTransactionsTab ? all : all.filter((t) => t.id !== "transactions");
  }, [canSeeTransactionsTab]);

  if (storesLoading) {
    return <PageSkeleton cards={2} />;
  }

  if (storesLoadError && fallbackStoreIds.length === 0) {
    return <ApiErrorState error={storesLoadErr} onRetry={() => void refetchStores()} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tồn kho</CardTitle>
          <CardDescription>
            {canSeeTransactionsTab
              ? "Chọn chế độ xem phù hợp: tồn theo từng kho, tồn gộp theo cửa hàng, phân bổ theo kho cho một biến thể, hoặc nhật ký biến động."
              : "Chọn chế độ xem phù hợp: tồn theo từng kho, tồn gộp theo cửa hàng, hoặc phân bổ theo kho cho một biến thể."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </CardContent>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tabs.find((x) => x.id === tab)?.hint}</p>
        </CardContent>
      </Card>

      {(tab === "by_wh" || tab === "by_store" || tab === "transactions") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chọn cửa hàng</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="inv-store">Cửa hàng</Label>
              {!storesLoadError ? (
                <select
                  id="inv-store"
                  className={selectClass}
                  value={storeId || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStoreId(Number.isFinite(v) ? v : 0);
                    setWarehouseId(0);
                    setWhPage(0);
                    setStoreInvPage(0);
                    setTxnPage(0);
                  }}
                >
                  <option value="">— Chọn cửa hàng —</option>
                  {storeOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="inv-store-fb"
                  className={selectClass}
                  value={storeId || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStoreId(Number.isFinite(v) ? v : 0);
                    setWarehouseId(0);
                  }}
                >
                  <option value="">— Chọn cửa hàng —</option>
                  {fallbackStoreIds.map((id) => (
                    <option key={id} value={id}>
                      {getStoreName(id)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {(tab === "by_wh" || tab === "transactions") && (
              <div className="flex-1 space-y-2">
                <Label htmlFor="inv-wh">Kho</Label>
                <select
                  id="inv-wh"
                  className={selectClass}
                  disabled={!storeId || warehousesQ.isPending}
                  value={warehouseId || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWarehouseId(Number.isFinite(v) ? v : 0);
                    setWhPage(0);
                    setTxnPage(0);
                  }}
                >
                  <option value="">{storeId ? "— Chọn kho —" : "Chọn cửa hàng trước"}</option>
                  {warehousesSorted.map((w) => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseName} · {warehouseTypeLabel(w.warehouseType)}
                    </option>
                  ))}
                </select>
                {warehousesQ.isError ? <p className="text-xs text-destructive">Không tải được danh sách kho.</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "by_wh" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tồn trong kho đã chọn</CardTitle>
            <CardDescription>Mỗi dòng là một biến thể tại kho này.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!warehouseId ? (
              <p className="text-sm text-muted-foreground">Vui lòng chọn kho để xem tồn.</p>
            ) : invByWhQ.isError ? (
              <ApiErrorState error={invByWhQ.error} onRetry={() => void invByWhQ.refetch()} />
            ) : invByWhQ.isPending ? (
              <PageSkeleton cards={0} />
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU · tên biến thể</TableHead>
                        <TableHead className="text-right">Tồn thực tế</TableHead>
                        <TableHead className="text-right">Đang giữ chỗ</TableHead>
                        <TableHead>Cập nhật</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invByWhQ.data.content.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Không có dữ liệu tồn.
                          </TableCell>
                        </TableRow>
                      ) : (
                        invByWhQ.data.content.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm">{formatInventoryVariantLabel(row)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatQty(row.quantityOnHand)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatQty(row.reservedQty)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDateTimeVi(row.updatedAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationBar page={invByWhQ.data} onPageChange={setWhPage} disabled={invByWhQ.isFetching} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "by_store" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tồn gộp theo cửa hàng</CardTitle>
            <CardDescription>
              Dữ liệu gộp từ mọi kho của cửa hàng; cùng biến thể có thể có nhiều dòng (mỗi kho một dòng).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!storeId ? (
              <p className="text-sm text-muted-foreground">Vui lòng chọn cửa hàng.</p>
            ) : invByStoreQ.isError ? (
              <ApiErrorState error={invByStoreQ.error} onRetry={() => void invByStoreQ.refetch()} />
            ) : invByStoreQ.isPending ? (
              <PageSkeleton cards={0} />
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kho</TableHead>
                        <TableHead>SKU · tên biến thể</TableHead>
                        <TableHead className="text-right">Tồn thực tế</TableHead>
                        <TableHead className="text-right">Đang giữ chỗ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invByStoreQ.data.content.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Không có dữ liệu tồn.
                          </TableCell>
                        </TableRow>
                      ) : (
                        invByStoreQ.data.content.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm text-muted-foreground">{getWarehouseName(row.warehouseId)}</TableCell>
                            <TableCell className="text-sm">{formatInventoryVariantLabel(row)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatQty(row.quantityOnHand)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatQty(row.reservedQty)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationBar page={invByStoreQ.data} onPageChange={setStoreInvPage} disabled={invByStoreQ.isFetching} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "availability" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Khả dụng theo từng kho</CardTitle>
            <CardDescription>Chọn cửa hàng và biến thể (SKU / tên) để xem phân bổ số lượng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="av-store">Cửa hàng</Label>
                {!storesLoadError ? (
                  <select
                    id="av-store"
                    className={selectClass}
                    value={availStoreId || ""}
                    onChange={(e) => setAvailStoreId(Number(e.target.value) || 0)}
                  >
                    <option value="">— Chọn —</option>
                    {storeOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    id="av-store-fb"
                    className={selectClass}
                    value={availStoreId || ""}
                    onChange={(e) => setAvailStoreId(Number(e.target.value) || 0)}
                  >
                    <option value="">— Chọn —</option>
                    {fallbackStoreIds.map((id) => (
                      <option key={id} value={id}>
                        {getStoreName(id)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="av-var">Biến thể (SKU / tên)</Label>
                <VariantSearchCombobox
                  key={`av-variant-${availStoreId}`}
                  id="av-var"
                  name="availabilityVariant"
                  storeId={availStoreId}
                  value={availVariantPick}
                  onChange={setAvailVariantPick}
                  disabled={!availStoreId}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                if (!availStoreId || availVariantPick <= 0) return;
                setAvailSubmitted({ storeId: availStoreId, variantId: availVariantPick });
              }}
            >
              Tra cứu
            </Button>

            {availabilityQ.isFetching ? <PageSkeleton cards={0} /> : null}
            {availabilityQ.isError ? <ApiErrorState error={availabilityQ.error} onRetry={() => void availabilityQ.refetch()} /> : null}
            {availabilityQ.data ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Biến thể:{" "}
                  <span className="font-normal text-muted-foreground">
                    {formatInventoryVariantLabel(availabilityQ.data)}
                  </span>
                </p>
                <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên kho</TableHead>
                      <TableHead>Loại kho</TableHead>
                      <TableHead>Chi nhánh</TableHead>
                      <TableHead className="text-right">Tồn thực tế</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availabilityQ.data.locations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Không có dữ liệu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      availabilityQ.data.locations.map((loc) => (
                        <TableRow key={loc.warehouseId}>
                          <TableCell className="font-medium">{loc.warehouseName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{warehouseTypeLabel(loc.warehouseType)}</Badge>
                          </TableCell>
                          <TableCell>{loc.branchName ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatQty(loc.quantityOnHand)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {tab === "transactions" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biến động tồn theo kho</CardTitle>
            <CardDescription>Lọc theo loại giao dịch, biến thể và khoảng thời gian (tuỳ chọn).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!warehouseId ? (
              <p className="text-sm text-muted-foreground">Vui lòng chọn cửa hàng và kho.</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Loại giao dịch</Label>
                    <select className={selectClass} value={txnType} onChange={(e) => setTxnType(e.target.value)}>
                      <option value="">Tất cả</option>
                      {TXN_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {inventoryTransactionTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Biến thể (tuỳ chọn)</Label>
                    <VariantSearchCombobox
                      key={`txn-variant-${storeId}`}
                      name="txnVariantFilter"
                      storeId={storeId}
                      value={txnVariantPick}
                      onChange={setTxnVariantPick}
                      disabled={!storeId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Từ thời điểm</Label>
                    <Input type="datetime-local" value={txnFrom} onChange={(e) => setTxnFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Đến thời điểm</Label>
                    <Input type="datetime-local" value={txnTo} onChange={(e) => setTxnTo(e.target.value)} />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setTxnPage(0);
                    void txnQ.refetch();
                  }}
                >
                  Áp dụng bộ lọc
                </Button>

                {txnQ.isError ? <ApiErrorState error={txnQ.error} onRetry={() => void txnQ.refetch()} /> : null}
                {txnQ.isPending ? <PageSkeleton cards={0} /> : null}
                {txnQ.data ? (
                  <>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Thời điểm</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>SKU · tên biến thể</TableHead>
                            <TableHead className="text-right">Thay đổi</TableHead>
                            <TableHead className="text-right">Trước</TableHead>
                            <TableHead className="text-right">Sau</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead>Ghi chú</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {txnQ.data.content.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                Không có biến động.
                              </TableCell>
                            </TableRow>
                          ) : (
                            txnQ.data.content.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap text-sm">{formatDateTimeVi(row.createdAt)}</TableCell>
                                <TableCell>{inventoryTransactionTypeLabel(row.transactionType)}</TableCell>
                                <TableCell className="text-sm">{formatInventoryVariantLabel(row)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatQty(row.qtyChange)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatQty(row.qtyBefore)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatQty(row.qtyAfter)}</TableCell>
                                <TableCell className="text-right text-sm">
                                  {row.unitCost != null ? formatVndFromDecimal(row.unitCost) : "—"}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                  {row.note ?? "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationBar page={txnQ.data} onPageChange={setTxnPage} disabled={txnQ.isFetching} />
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
