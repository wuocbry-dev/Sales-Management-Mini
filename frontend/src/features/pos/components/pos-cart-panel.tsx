import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { displayVariantName, type PosCartLine } from "@/features/pos/types";
import { formatVndFromDecimal } from "@/lib/format-vnd";

type PosCartPanelProps = {
  compact?: boolean;
  showSummary?: boolean;
  lines: PosCartLine[];
  headerDiscount: number;
  onHeaderDiscountChange: (value: number) => void;
  onIncQty: (variantId: number) => void;
  onDecQty: (variantId: number) => void;
  onRemoveLine: (variantId: number) => void;
};

function lineTotal(line: PosCartLine): number {
  return Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
}

export function PosCartPanel({
  compact = false,
  showSummary = true,
  lines,
  headerDiscount,
  onHeaderDiscountChange,
  onIncQty,
  onDecQty,
  onRemoveLine,
}: PosCartPanelProps) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const total = Math.max(0, subtotal - Math.max(0, headerDiscount));

  return (
    <Card className="pos-panel h-full min-h-0">
      <CardHeader className="pb-2">
        <CardTitle className={compact ? "text-sm" : "text-base"}>Giỏ hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[45dvh] space-y-2 overflow-auto pr-1">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có sản phẩm.</p>
          ) : (
            lines.map((line) => (
              <div key={line.variantId} className="rounded-md border p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{displayVariantName(line)}</p>
                    <p className="text-xs text-muted-foreground">{line.sku}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => onRemoveLine(line.variantId)}>
                    Xóa
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => onDecQty(line.variantId)}>
                      -
                    </Button>
                    <span className="min-w-8 text-center text-sm">{line.quantity}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => onIncQty(line.variantId)}>
                      +
                    </Button>
                  </div>
                  <p className="text-sm font-semibold">{formatVndFromDecimal(lineTotal(line))}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Giảm giá đơn
            <Input
              type="number"
              min={0}
              step="1000"
              value={headerDiscount}
              onChange={(e) => onHeaderDiscountChange(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          {showSummary ? (
            <div className="rounded-md border bg-muted/30 p-2 text-sm">
              <p>Tạm tính: <span className="font-semibold">{formatVndFromDecimal(subtotal)}</span></p>
              <p>Tổng: <span className="font-semibold">{formatVndFromDecimal(total)}</span></p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
