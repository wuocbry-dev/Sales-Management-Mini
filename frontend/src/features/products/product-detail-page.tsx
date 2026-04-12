import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchProductById } from "@/api/products-api";
import { hasPermission } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogStatusLabel } from "@/lib/catalog-status-labels";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { formatQty } from "@/lib/format-qty";
import { productTypeLabel } from "@/lib/product-type-labels";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

export function ProductDetailPage() {
  const me = useAuthStore((s) => s.me);
  const canEditProduct = Boolean(me && hasPermission(me, "PRODUCT_UPDATE"));
  const { id } = useParams();
  const pid = Number(id);
  const invalid = !Number.isFinite(pid) || pid <= 0;

  const q = useQuery({
    queryKey: ["products", pid],
    queryFn: () => fetchProductById(pid),
    enabled: !invalid,
  });

  const { getStoreName } = useStoreNameMap();

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Mã sản phẩm không đúng định dạng.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/san-pham">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const p = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/san-pham">← Danh sách sản phẩm</Link>
        </Button>
        {canEditProduct ? (
          <Button size="sm" asChild>
            <Link to={`/app/san-pham/${pid}/sua`}>Chỉnh sửa</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{p.productName}</CardTitle>
          <CardDescription className="font-mono text-sm">{p.productCode}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary" className="mt-1">
              {catalogStatusLabel(p.status)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loại hàng</p>
            <p className="mt-1 text-sm font-medium">{productTypeLabel(p.productType)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cửa hàng</p>
            <p className="mt-1 text-sm font-medium">{getStoreName(p.storeId)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Theo dõi tồn kho</p>
            <p className="mt-1 text-sm font-medium">{p.trackInventory ? "Có" : "Không"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Có nhiều biến thể</p>
            <p className="mt-1 text-sm font-medium">{p.hasVariant ? "Có" : "Không"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tham chiếu nhóm / thương hiệu / đơn vị</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[p.categoryId != null ? `Nhóm: ${p.categoryId}` : null, p.brandId != null ? `Thương hiệu: ${p.brandId}` : null, p.unitId != null ? `Đơn vị: ${p.unitId}` : null]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
          {p.description ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">Mô tả</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{p.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Biến thể &amp; giá</CardTitle>
          <CardDescription>Chi tiết SKU, giá và mức đặt hàng lại.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Mã vạch</TableHead>
                <TableHead>Tên hiển thị</TableHead>
                <TableHead className="text-right">Giá vốn</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-right">Mức đặt lại</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Chưa có biến thể.
                  </TableCell>
                </TableRow>
              ) : (
                p.variants.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                    <TableCell className="font-mono text-sm">{v.barcode ?? "—"}</TableCell>
                    <TableCell>{v.variantName ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(v.costPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(v.sellingPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatQty(v.reorderLevel)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{catalogStatusLabel(v.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
