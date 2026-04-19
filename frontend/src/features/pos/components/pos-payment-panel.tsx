import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatVndFromDecimal } from "@/lib/format-vnd";

type PosStatus = "idle" | "scanning" | "payment" | "success" | "error";

type PosPaymentPanelProps = {
  lineCount: number;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  posStatus: PosStatus;
  statusMessage: string | null;
  showCancel?: boolean;
  onCashReceivedChange: (value: number) => void;
  onComplete: () => void;
  onHold: () => void;
  onBackToInput: () => void;
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
  const busy = posStatus === "payment";

  return (
    <Card className="pos-panel">
      <CardHeader>
        <CardTitle className="text-base">Bước 3: Thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p>Số dòng: <span className="font-semibold">{lineCount}</span></p>
            <p>Tổng tiền: <span className="font-semibold">{formatVndFromDecimal(totalAmount)}</span></p>
            <p>Tiền thối: <span className="font-semibold">{formatVndFromDecimal(changeAmount)}</span></p>
          </div>

          <label className="text-sm font-medium text-muted-foreground">
            Khách đưa
            <Input
              type="number"
              min={0}
              step="1000"
              value={cashReceived}
              onChange={(e) => onCashReceivedChange(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={posStatus === "error" ? "destructive" : "secondary"}>
            {statusMessage ?? "Sẵn sàng"}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Button type="button" variant="outline" onClick={onBackToInput} disabled={busy}>
            Quay lại nhập hàng
          </Button>
          <Button type="button" variant="secondary" onClick={onHold} disabled={busy}>
            Tạm giữ
          </Button>
          <Button type="button" onClick={onComplete} disabled={busy || cashReceived < totalAmount || lineCount === 0}>
            {busy ? "Đang xử lý..." : "Hoàn tất thanh toán"}
          </Button>
          {showCancel ? (
            <Button type="button" variant="outline" className="text-red-600 hover:text-red-700" onClick={onCancel} disabled={busy}>
              Hủy đơn
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
