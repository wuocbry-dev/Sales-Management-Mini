import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { warehouseTypeLabel } from "@/lib/warehouse-type-labels";
import type { WarehouseResponse } from "@/types/warehouse";

function sortWarehouses(rows: WarehouseResponse[]): WarehouseResponse[] {
  return [...rows].sort((a, b) => {
    const oa = a.warehouseType === "CENTRAL" ? 0 : 1;
    const ob = b.warehouseType === "CENTRAL" ? 0 : 1;
    if (oa !== ob) return oa - ob;
    return a.warehouseName.localeCompare(b.warehouseName, "vi");
  });
}

export function WarehouseListPage() {
  const { storeId: sid } = useParams();
  const storeId = Number(sid);

  const q = useQuery({
    queryKey: ["warehouses", storeId],
    queryFn: () => fetchWarehousesForStore(storeId),
    enabled: Number.isFinite(storeId) && storeId > 0,
  });

  if (!Number.isFinite(storeId) || storeId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu thông tin cửa hàng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const rows = sortWarehouses(q.data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/cua-hang/${storeId}`}>← Cửa hàng</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kho hàng</CardTitle>
          <CardDescription>
            Chỉ xem dữ liệu theo quyền được cấp. Kho tổng cửa hàng và kho chi nhánh được phân biệt theo loại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên kho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Chưa có kho nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.warehouseId}>
                      <TableCell>
                        <Badge variant="outline">{warehouseTypeLabel(row.warehouseType)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.warehouseCode}</TableCell>
                      <TableCell className="font-medium">{row.warehouseName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activeInactiveLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/cua-hang/${storeId}/kho/${row.warehouseId}`}>Mở</Link>
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
