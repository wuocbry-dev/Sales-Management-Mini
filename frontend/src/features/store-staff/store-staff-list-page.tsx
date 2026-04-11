import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchStoreStaffPage, softDeactivateStoreStaff } from "@/api/store-staff-api";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateStoreStaffArea } from "@/features/auth/gates";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatApiError } from "@/lib/api-errors";
import { formatDateTimeVi } from "@/lib/format-datetime";

const DEFAULT_SIZE = 15;

function isActiveStoreStaffStatus(status: string) {
  return status.trim().toUpperCase() === "ACTIVE";
}

const selectClass =
  "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StoreStaffListPage() {
  const me = useAuthStore((s) => s.me);
  const qc = useQueryClient();
  const canArea = Boolean(me && gateStoreStaffArea(me));
  const admin = Boolean(me && isSystemManage(me));

  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));
  const roleCode = (params.get("vaiTro") ?? "").trim();
  const status = (params.get("trangThai") ?? "").trim();
  const storeFilter = params.get("cuaHang");
  const storeId = storeFilter && storeFilter !== "" ? Number(storeFilter) : undefined;

  const storesQ = useQuery({
    queryKey: ["stores", "staff-filter"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    enabled: admin && canArea,
  });

  const listQ = useQuery({
    queryKey: ["store-staff", page, size, roleCode, status, storeId],
    queryFn: () =>
      fetchStoreStaffPage({
        page,
        size,
        ...(roleCode ? { roleCode } : {}),
        ...(status ? { status } : {}),
        ...(storeId != null && Number.isFinite(storeId) ? { storeId } : {}),
      }),
    enabled: canArea,
  });

  const deactivateM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: (userId: number) => softDeactivateStoreStaff(userId),
    onSuccess: async () => {
      toast.success("Đã ngưng nhân viên (xóa mềm).");
      await qc.invalidateQueries({ queryKey: ["store-staff"] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    p.set("trang", "0");
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  const stores = storesQ.data?.content ?? [];

  if (!canArea) return null;

  if (listQ.isPending) return <PageSkeleton cards={2} />;
  if (listQ.isError) return <ApiErrorState error={listQ.error} onRetry={() => void listQ.refetch()} />;
  const data = listQ.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Nhân viên cửa hàng</CardTitle>
            <CardDescription>Thu ngân và nhân viên kho theo phạm vi bạn quản lý.</CardDescription>
          </div>
          <Button type="button" asChild>
            <Link to="/app/nhan-vien-cua-hang/moi">Thêm nhân viên</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
              <select
                className={selectClass + " min-w-[160px]"}
                value={roleCode}
                onChange={(e) => setFilter("vaiTro", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="CASHIER">Thu ngân</option>
                <option value="WAREHOUSE_STAFF">Nhân viên kho</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
              <select
                className={selectClass + " min-w-[160px]"}
                value={status}
                onChange={(e) => setFilter("trangThai", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
              </select>
            </div>
            {admin ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Cửa hàng</p>
                <select
                  className={selectClass + " min-w-[200px]"}
                  value={storeFilter ?? ""}
                  onChange={(e) => setFilter("cuaHang", e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {stores.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Mã cửa hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tạo lúc</TableHead>
                  <TableHead className="w-[200px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Chưa có nhân viên phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="font-mono text-sm">{row.username}</TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell className="text-sm">{row.roleCode}</TableCell>
                      <TableCell>{row.storeId}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{userAccountStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTimeVi(row.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/app/nhan-vien-cua-hang/${row.userId}`}>Mở</Link>
                          </Button>
                          {isActiveStoreStaffStatus(row.status) && me && row.userId !== me.id ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={deactivateM.isPending}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Ngưng tài khoản "${row.username}"? Họ sẽ không đăng nhập được (có thể xem lại trong bộ lọc trạng thái).`,
                                  )
                                ) {
                                  return;
                                }
                                deactivateM.mutate(row.userId);
                              }}
                            >
                              Ngưng
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
