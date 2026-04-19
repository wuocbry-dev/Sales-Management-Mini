import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBranchesForStore } from "@/api/branches-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BranchFormDialog } from "@/features/branches/branch-form-dialog";
import { isSystemManage } from "@/features/auth/access";
import { gateBranchCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { activeInactiveLabel, activeInactiveTextClass } from "@/lib/entity-status-labels";
import { Building2 } from "lucide-react";
import type { BranchResponse } from "@/types/branch";

const BRANCH_PAGE_SIZE = 500;

export function BranchHubPage() {
  const me = useAuthStore((s) => s.me);
  const qc = useQueryClient();
  const canCreate = Boolean(me && gateBranchCreate(me));
  const [createOpen, setCreateOpen] = useState(false);

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

  const branchQueries = useQueries({
    queries: targetStoreIds.map((storeId) => ({
      queryKey: ["branches", "hub", storeId],
      queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: BRANCH_PAGE_SIZE }),
      enabled: targetStoreIds.length > 0,
    })),
  });

  const rows = useMemo(() => {
    const list: BranchResponse[] = [];
    for (const q of branchQueries) {
      for (const b of q.data?.content ?? []) list.push(b);
    }
    return list.sort((a, b) => {
      const sa = getStoreName(a.storeId).localeCompare(getStoreName(b.storeId), "vi");
      if (sa !== 0) return sa;
      return a.branchName.localeCompare(b.branchName, "vi");
    });
  }, [branchQueries, getStoreName]);

  const branchesPending = branchQueries.some((q) => q.isPending);
  const branchQueryError = branchQueries.find((q) => q.isError);
  const showStoreColumn = targetStoreIds.length > 1;

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
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg">Chi nhánh</CardTitle>
          </div>
          <CardDescription>Bạn chưa được gán cửa hàng nào để xem chi nhánh.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (admin && targetStoreIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg">Chi nhánh</CardTitle>
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

  if (branchesPending) {
    return <PageSkeleton cards={2} />;
  }

  if (branchQueryError) {
    return <ApiErrorState error={branchQueryError.error} onRetry={() => void branchQueryError.refetch()} />;
  }

  const singleStoreId = targetStoreIds.length === 1 ? targetStoreIds[0] : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <CardTitle className="text-lg">Chi nhánh</CardTitle>
              <CardDescription>
                {admin
                  ? "Tất cả chi nhánh theo cửa hàng trong hệ thống."
                  : "Chi nhánh thuộc các cửa hàng bạn được phân quyền."}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {admin ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/cua-hang">Danh sách cửa hàng</Link>
              </Button>
            ) : null}
            {canCreate && singleStoreId > 0 ? (
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                Thêm chi nhánh
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showStoreColumn ? <TableHead>Cửa hàng</TableHead> : null}
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showStoreColumn ? 8 : 7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chưa có chi nhánh nào trong phạm vi này.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={`${row.storeId}-${row.branchId}`}>
                      {showStoreColumn ? (
                        <TableCell className="text-sm font-medium">{getStoreName(row.storeId)}</TableCell>
                      ) : null}
                      <TableCell className="font-mono text-sm">{row.branchCode}</TableCell>
                      <TableCell className="font-medium">{row.branchName}</TableCell>
                      <TableCell className="text-sm">{row.phone?.trim() ? row.phone : "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm" title={row.email ?? undefined}>
                        {row.email?.trim() ? row.email : "—"}
                      </TableCell>
                      <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm text-muted-foreground">
                        {row.address?.trim() ? row.address : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={activeInactiveTextClass(row.status)}>{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/cua-hang/${row.storeId}/chi-nhanh/${row.branchId}`}>Chi tiết</Link>
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

      {canCreate && singleStoreId > 0 ? (
        <BranchFormDialog
          mode="create"
          storeId={singleStoreId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={async () => {
            await qc.invalidateQueries({ queryKey: ["branches", "hub"] });
          }}
        />
      ) : null}
    </div>
  );
}
