import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchBrandsPage } from "@/api/brands-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { fetchProductsPage } from "@/api/products-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission } from "@/features/auth/access";
import { canSeeProductCreate } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { catalogStatusLabel } from "@/lib/catalog-status-labels";
import { productTypeLabel } from "@/lib/product-type-labels";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

const DEFAULT_SIZE = 10;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function parseOptionalLong(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function ProductListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && canSeeProductCreate(me));
  const canEdit = Boolean(me && hasPermission(me, "PRODUCT_UPDATE"));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const statusFilter = params.get("trangThai") ?? "";
  const categoryId = parseOptionalLong(params.get("nhomHang"));
  const brandId = parseOptionalLong(params.get("thuongHieu"));
  const q = (params.get("tuKhoa") ?? "").trim();

  const [draftStatus, setDraftStatus] = useState(statusFilter);
  const [draftCategory, setDraftCategory] = useState(params.get("nhomHang") ?? "");
  const [draftBrand, setDraftBrand] = useState(params.get("thuongHieu") ?? "");
  const [draftQ, setDraftQ] = useState(q);

  const searchKey = params.toString();
  useEffect(() => {
    setDraftStatus(params.get("trangThai") ?? "");
    setDraftCategory(params.get("nhomHang") ?? "");
    setDraftBrand(params.get("thuongHieu") ?? "");
    setDraftQ((params.get("tuKhoa") ?? "").trim());
  }, [searchKey, params]);

  const brandsQ = useQuery({
    queryKey: ["products-filters", "brands"],
    queryFn: () => fetchBrandsPage({ page: 0, size: 200 }),
  });
  const categoriesQ = useQuery({
    queryKey: ["products-filters", "categories"],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 200 }),
  });

  const listQ = useQuery({
    queryKey: ["products", page, size, statusFilter, categoryId, brandId, q],
    queryFn: () =>
      fetchProductsPage({
        page,
        size,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryId != null ? { categoryId } : {}),
        ...(brandId != null ? { brandId } : {}),
        ...(q ? { q } : {}),
      }),
  });

  const { getStoreName } = useStoreNameMap();

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  const applyFilters = () => {
    const p = new URLSearchParams();
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    if (draftStatus) p.set("trangThai", draftStatus);
    if (draftCategory.trim()) p.set("nhomHang", draftCategory.trim());
    if (draftBrand.trim()) p.set("thuongHieu", draftBrand.trim());
    if (draftQ.trim()) p.set("tuKhoa", draftQ.trim());
    setParams(p, { replace: true });
  };

  const resetFilters = () => {
    setDraftStatus("");
    setDraftCategory("");
    setDraftBrand("");
    setDraftQ("");
    setParams(new URLSearchParams({ trang: "0", kichThuoc: String(size) }), { replace: true });
  };

  const brandOptions = useMemo(() => brandsQ.data?.content ?? [], [brandsQ.data]);
  const categoryOptions = useMemo(() => categoriesQ.data?.content ?? [], [categoriesQ.data]);

  if (listQ.isPending) return <PageSkeleton cards={2} />;
  if (listQ.isError) return <ApiErrorState error={listQ.error} onRetry={() => void listQ.refetch()} />;
  const data = listQ.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Sản phẩm</CardTitle>
            <CardDescription>Danh mục sản phẩm theo phạm vi cửa hàng được phân quyền.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/app/san-pham/moi">Thêm sản phẩm</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="flt-status">Trạng thái</Label>
              <select
                id="flt-status"
                className={selectClass}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flt-cat">Nhóm hàng</Label>
              <select
                id="flt-cat"
                className={selectClass}
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                disabled={categoriesQ.isError}
              >
                <option value="">Tất cả</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flt-brand">Thương hiệu</Label>
              <select
                id="flt-brand"
                className={selectClass}
                value={draftBrand}
                onChange={(e) => setDraftBrand(e.target.value)}
                disabled={brandsQ.isError}
              >
                <option value="">Tất cả</option>
                {brandOptions.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="flt-q">Tìm theo mã hoặc tên</Label>
              <Input
                id="flt-q"
                placeholder="Nhập một phần mã hoặc tên…"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={applyFilters}>
              Áp dụng bộ lọc
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
          {(categoriesQ.isError || brandsQ.isError) && (
            <p className="text-sm text-muted-foreground">
              Một số bộ lọc tham chiếu không tải được; bạn vẫn có thể tìm theo mã hoặc tên.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kết quả</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Cửa hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="min-w-[140px] text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có sản phẩm phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.productCode}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell>{productTypeLabel(row.productType)}</TableCell>
                      <TableCell className="text-sm">{getStoreName(row.storeId)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{catalogStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/app/san-pham/${row.id}`}>Mở</Link>
                          </Button>
                          {canEdit ? (
                            <Button variant="secondary" size="sm" asChild>
                              <Link to={`/app/san-pham/${row.id}/sua`}>Sửa</Link>
                            </Button>
                          ) : null}
                        </div>
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
