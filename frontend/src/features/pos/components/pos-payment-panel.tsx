import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { PosStatus } from "@/features/pos/pos-machine";

type PosPaymentPanelProps = {
  lineCount: number;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  posStatus: PosStatus;
  statusMessage?: string | null;
  showCancel?: boolean;
  onCashReceivedChange: (v: number) => void;
  onComplete: () => void;
  onHold: () => void;
  onBackToInput?: () => void;
  onCancel: () => void;
};

export function PosPaymentPanel({
  lineCount,
  totalAmount,
  cashReceived,
  changeAmount,
  posStatus,
  statusMessage,
  showCancel = true,
  onCashReceivedChange,
  onComplete,
  onHold,
  onBackToInput,
  onCancel,
}: PosPaymentPanelProps) {
  const inFlight = posStatus === "payment";
  const quickDenominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

  const formatCashInput = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return "";
    return new Intl.NumberFormat("vi-VN").format(Math.trunc(value));
  };

  const parseCashInput = (value: string): number => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (!digitsOnly) return 0;
    return Math.max(0, Number.parseInt(digitsOnly, 10) || 0);
  };

  const statusVariant =
    posStatus === "success"
      ? "success"
      : posStatus === "error"
        ? "destructive"
        : posStatus === "payment"
          ? "warning"
          : posStatus === "scanning"
            ? "secondary"
            : "muted";

  const statusLabel =
    posStatus === "success"
      ? "Thành công"
      : posStatus === "error"
        ? "Lỗi"
        : posStatus === "payment"
          ? "Đang xử lý"
          : posStatus === "scanning"
            ? "Quét"
            : "Sẵn sàng";

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hành động thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 pb-3">
        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] p-2">
          <Badge variant="secondary">Dòng: {lineCount}</Badge>
          <span className="text-2xl font-bold tabular-nums text-[hsl(var(--pos-primary))]">{formatVndFromDecimal(totalAmount)}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] p-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <span className="text-xs text-muted-foreground">{statusMessage ?? "Sẵn sàng"}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] p-2">
          <span className="text-sm font-medium text-muted-foreground">Phương thức thanh toán</span>
          <Badge variant="default">Tiền mặt</Badge>
        </div>

        <div className="space-y-2 rounded-md border border-[hsl(var(--pos-border))] p-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Khách đưa</label>
              <div className="text-xs text-muted-foreground">
                Tiền thối: <span className="font-semibold tabular-nums text-[hsl(var(--pos-primary))]">{formatVndFromDecimal(changeAmount)}</span>
              </div>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9.\s]*"
              min={0}
              step="1000"
              value={formatCashInput(cashReceived)}
              disabled={inFlight}
              onChange={(e) => onCashReceivedChange(parseCashInput(e.target.value))}
              className="h-10"
            />
            <div className="text-xs text-muted-foreground">
              Đã nhập: <span className="font-semibold text-foreground">{formatVndFromDecimal(cashReceived)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mệnh giá nhanh</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {quickDenominations.map((denomination) => (
                <Button
                  key={denomination}
                  type="button"
                  variant="outline"
                  className="h-10 px-2 text-sm font-medium"
                  disabled={inFlight}
                  onClick={() => onCashReceivedChange(cashReceived + denomination)}
                >
                  {formatVndFromDecimal(denomination)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button type="button" className="h-12 w-full text-base font-bold" onClick={onComplete} disabled={lineCount === 0 || inFlight}>
          {inFlight ? "Đang xử lý..." : "Hoàn tất thanh toán"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={onHold} disabled={inFlight}>
            Lưu đơn tạm
          </Button>
          {showCancel ? (
            <Button type="button" variant="outline" className="h-11 border-destructive text-destructive" onClick={onCancel} disabled={inFlight}>
              Hủy
            </Button>
          ) : (
            <Button type="button" variant="outline" className="h-11" onClick={onBackToInput} disabled={inFlight}>
              Quay lại bước nhập sản phẩm
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
