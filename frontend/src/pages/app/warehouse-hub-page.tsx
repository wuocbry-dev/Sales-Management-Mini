import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { warehouseTypeLabel } from "@/lib/warehouse-type-labels";
import { Archive } from "lucide-react";
import type { BranchResponse } from "@/types/branch";
import type { WarehouseResponse } from "@/types/warehouse";

const BRANCH_PAGE_SIZE = 500;

function sortWarehouses(rows: WarehouseResponse[]): WarehouseResponse[] {
  return [...rows].sort((a, b) => {
    const oa = a.warehouseType === "CENTRAL" ? 0 : 1;
    const ob = b.warehouseType === "CENTRAL" ? 0 : 1;
    if (oa !== ob) return oa - ob;
    const sa = a.storeId !== b.storeId ? a.storeId - b.storeId : 0;
    if (sa !== 0) return sa;
    return a.warehouseName.localeCompare(b.warehouseName, "vi");
  });
}

export function WarehouseHubPage() {
  const me = useAuthStore((s) => s.me);

  const {
    stores: catalogStores,
    getStoreName,
    isPending: storesPending,
    isError: storesLoadFailed,
    error: storesLoadErr,
    refetch: refetchStores,
  } = useStoreNameMap({ enabled: Boolean(me) });

  const admin = Boolean(me && isSystemManage(me));
  const scopedStoreIds = useMemo(() => (me?.storeIds ?? []).filter((id) => id > 0), [me]);

  const targetStoreIds = useMemo(() => {
    if (!me) return [];
    if (admin) {
      const fromCatalog = catalogStores.map((s) => s.id);
      if (fromCatalog.length > 0) return fromCatalog;
      return scopedStoreIds;
    }
    return scopedStoreIds;
  }, [me, admin, catalogStores, scopedStoreIds]);

  const warehouseQueries = useQueries({
    queries: targetStoreIds.map((storeId) => ({
      queryKey: ["warehouses", "hub", storeId],
      queryFn: () => fetchWarehousesForStore(storeId),
      enabled: targetStoreIds.length > 0,
    })),
  });

  const branchQueries = useQueries({
    queries: targetStoreIds.map((storeId) => ({
      queryKey: ["branches", "hub", storeId],
      queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: BRANCH_PAGE_SIZE }),
      enabled: targetStoreIds.length > 0,
    })),
  });

  const branchByStoreAndId = useMemo(() => {
    const m = new Map<string, BranchResponse>();
    for (const q of branchQueries) {
      for (const b of q.data?.content ?? []) {
        m.set(`${b.storeId}-${b.branchId}`, b);
      }
    }
    return m;
  }, [branchQueries]);

  const warehouseRows = useMemo(() => {
    const list: WarehouseResponse[] = [];
    for (const q of warehouseQueries) {
      for (const w of q.data ?? []) list.push(w);
    }
    return sortWarehouses(list);
  }, [warehouseQueries]);

  const warehousesPending = warehouseQueries.some((q) => q.isPending);
  const warehouseQueryError = warehouseQueries.find((q) => q.isError);
  const showStoreColumn = targetStoreIds.length > 1;

  const branchLinkText = (storeId: number, branchId: number | null) => {
    if (branchId == null) return "Kho tổng cửa hàng";
    const b = branchByStoreAndId.get(`${storeId}-${branchId}`);
    return b ? `${b.branchName} (${b.branchCode})` : `Chi nhánh #${branchId}`;
  };

  if (!me) return null;

  if (admin && storesLoadFailed && scopedStoreIds.length === 0) {
    return <ApiErrorState error={storesLoadErr} onRetry={() => void refetchStores()} />;
  }

  if (admin && storesPending && scopedStoreIds.length === 0) {
    return <PageSkeleton cards={2} />;
  }

  if (!admin && scopedStoreIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg">Kho hàng</CardTitle>
          </div>
          <CardDescription>Bạn chưa được gán cửa hàng nào để xem kho.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (admin && targetStoreIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg">Kho hàng</CardTitle>
          </div>
          <CardDescription>Chưa có cửa hàng trong hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/app/cua-hang">Quản lý cửa hàng</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (warehousesPending) {
    return <PageSkeleton cards={2} />;
  }

  if (warehouseQueryError) {
    return <ApiErrorState error={warehouseQueryError.error} onRetry={() => void warehouseQueryError.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Archive className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <CardTitle className="text-lg">Kho hàng</CardTitle>
              <CardDescription>
                {admin
                  ? "Tất cả kho theo cửa hàng trong hệ thống."
                  : "Kho thuộc các cửa hàng bạn được phân quyền."}
              </CardDescription>
            </div>
          </div>
          {admin ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/cua-hang">Danh sách cửa hàng</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showStoreColumn ? <TableHead>Cửa hàng</TableHead> : null}
                  <TableHead>Loại kho</TableHead>
                  <TableHead>Mã kho</TableHead>
                  <TableHead>Tên kho</TableHead>
                  <TableHead>Liên kết chi nhánh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="tabular-nums">ID kho</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showStoreColumn ? 8 : 7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chưa có kho nào trong phạm vi này.
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouseRows.map((row) => (
                    <TableRow key={`${row.storeId}-${row.warehouseId}`}>
                      {showStoreColumn ? (
                        <TableCell className="text-sm font-medium">{getStoreName(row.storeId)}</TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant="outline">{warehouseTypeLabel(row.warehouseType)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.warehouseCode}</TableCell>
                      <TableCell className="font-medium">{row.warehouseName}</TableCell>
                      <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                        {branchLinkText(row.storeId, row.branchId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{row.warehouseId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/cua-hang/${row.storeId}/kho/${row.warehouseId}`}>Chi tiết</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
