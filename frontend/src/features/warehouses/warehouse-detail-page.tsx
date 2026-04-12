import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchWarehouse } from "@/api/warehouses-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { warehouseTypeLabel } from "@/lib/warehouse-type-labels";

export function WarehouseDetailPage() {
  const navigate = useNavigate();
  const { storeId: sid, warehouseId: wid } = useParams();
  const storeId = Number(sid);
  const warehouseId = Number(wid);

  const q = useQuery({
    queryKey: ["warehouses", storeId, warehouseId],
    queryFn: () => fetchWarehouse(storeId, warehouseId),
    enabled: Number.isFinite(storeId) && storeId > 0 && Number.isFinite(warehouseId) && warehouseId > 0,
  });

  if (!Number.isFinite(storeId) || storeId <= 0 || !Number.isFinite(warehouseId) || warehouseId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Liên kết kho không đúng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={1} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const w = q.data;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
        ← Quay lại
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{w.warehouseName}</CardTitle>
              <CardDescription className="font-mono">{w.warehouseCode}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{warehouseTypeLabel(w.warehouseType)}</Badge>
              <Badge variant="secondary">{activeInactiveLabel(w.status)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Liên kết chi nhánh</p>
            <p className="text-sm">{w.branchId != null ? "Gắn với một chi nhánh" : "Không gắn chi nhánh (kho tổng cửa hàng)"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
