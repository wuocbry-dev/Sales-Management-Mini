import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchCustomerById } from "@/api/customers-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { canSeeCustomerUpdate } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { catalogStatusLabel } from "@/lib/catalog-status-labels";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { genderLabel } from "@/lib/gender-labels";

export function CustomerDetailPage() {
  const me = useAuthStore((s) => s.me);
  const canUpdate = Boolean(me && canSeeCustomerUpdate(me));
  const { id } = useParams();
  const cid = Number(id);
  const invalid = !Number.isFinite(cid) || cid <= 0;
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["customers", cid],
    queryFn: () => fetchCustomerById(cid),
    enabled: !invalid,
  });

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Mã khách hàng không đúng.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/khach-hang">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const c = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/khach-hang">← Danh sách khách hàng</Link>
        </Button>
        {canUpdate ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Sửa thông tin
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{c.fullName}</CardTitle>
          <CardDescription className="font-mono text-sm">{c.customerCode}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary" className="mt-1">
              {catalogStatusLabel(c.status)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Điện thoại</p>
            <p className="mt-1 text-sm font-medium">{c.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 text-sm font-medium">{c.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Giới tính</p>
            <p className="mt-1 text-sm font-medium">{genderLabel(c.gender)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày sinh</p>
            <p className="mt-1 text-sm font-medium">{c.dateOfBirth ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Điểm thân thiết</p>
            <p className="mt-1 text-sm font-medium tabular-nums">{c.loyaltyPoints}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng đã chi</p>
            <p className="mt-1 text-sm font-medium tabular-nums">{formatVndFromDecimal(c.totalSpent)}</p>
          </div>
          {c.address ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">Địa chỉ</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.address}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canUpdate ? (
        <CustomerFormDialog
          mode="edit"
          customer={c}
          open={open}
          onOpenChange={setOpen}
          onSuccess={() => void q.refetch()}
        />
      ) : null}
    </div>
  );
}
