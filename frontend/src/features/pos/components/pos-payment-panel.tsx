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
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank", label: "Bank transfer" },
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
      ? "Success"
      : posStatus === "error"
        ? "Error"
        : posStatus === "payment"
          ? "Processing"
          : posStatus === "scanning"
            ? "Scanning"
            : "Idle";

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Payment actions</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] p-2">
          <Badge variant="secondary">Lines: {lineCount}</Badge>
          <span className="text-2xl font-bold tabular-nums text-[hsl(var(--pos-primary))]">{formatVndFromDecimal(totalAmount)}</span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-[hsl(var(--pos-border))] p-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <span className="text-xs text-muted-foreground">{statusMessage ?? "Ready"}</span>
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

        <Button type="button" className="h-12 w-full text-base font-bold" onClick={onComplete} disabled={lineCount === 0 || inFlight}>
          {inFlight ? "Processing..." : "Complete checkout"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={onHold} disabled={inFlight}>
            Hold order
          </Button>
          <Button type="button" variant="outline" className="h-11 border-destructive text-destructive" onClick={onCancel} disabled={inFlight}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
