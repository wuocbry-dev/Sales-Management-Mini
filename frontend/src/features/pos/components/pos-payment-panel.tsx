import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { PosStatus } from "@/features/pos/pos-machine";

type PaymentMethod = "cash" | "card" | "bank" | "qr";

type PosPaymentPanelProps = {
  lineCount: number;
  totalAmount: number;
  selectedMethod: PaymentMethod;
  posStatus: PosStatus;
  statusMessage?: string | null;
  onMethodChange: (m: PaymentMethod) => void;
  onComplete: () => void;
  onHold: () => void;
  onCancel: () => void;
};

const methodOptions: Array<{ id: PaymentMethod; label: string }> = [
  { id: "cash", label: "Tiền mặt" },
  { id: "card", label: "Thẻ" },
  { id: "bank", label: "Chuyển khoản" },
  { id: "qr", label: "QR" },
];

export function PosPaymentPanel({
  lineCount,
  totalAmount,
  selectedMethod,
  posStatus,
  statusMessage,
  onMethodChange,
  onComplete,
  onHold,
  onCancel,
}: PosPaymentPanelProps) {
  const inFlight = posStatus === "payment";

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
            ? "Đang quét"
            : "Sẵn sàng";

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
        <div className="rounded-md border border-[hsl(var(--pos-primary))] bg-[hsl(var(--pos-primary)/0.08)] p-3">
          <div className="mb-1 flex items-center justify-between">
            <Badge variant="secondary">Mặt hàng: {lineCount}</Badge>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Khách cần thanh toán</p>
          <span className="text-3xl font-bold tabular-nums text-[hsl(var(--pos-primary))]">{formatVndFromDecimal(totalAmount)}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Trạng thái giao dịch</span>
          <span className="text-xs text-muted-foreground">{statusMessage ?? "Sẵn sàng thanh toán"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {methodOptions.map((m) => (
            <Button
              key={m.id}
              type="button"
              className="h-12"
              variant={selectedMethod === m.id ? "default" : "outline"}
              disabled={inFlight}
              onClick={() => onMethodChange(m.id)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <Button type="button" className="h-16 w-full text-lg font-bold" onClick={onComplete} disabled={lineCount === 0 || inFlight}>
          {inFlight ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={onHold} disabled={inFlight}>
            Tạm giữ đơn
          </Button>
          <Button type="button" variant="outline" className="h-11 border-destructive text-destructive" onClick={onCancel} disabled={inFlight}>
            Xóa giỏ hàng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
