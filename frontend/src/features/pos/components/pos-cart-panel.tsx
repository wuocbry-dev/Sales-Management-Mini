import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { cn } from "@/lib/utils";
import { displayVariantName, type PosCartLine } from "@/features/pos/types";

type PosCartPanelProps = {
  lines: PosCartLine[];
  headerDiscount: number;
  compact?: boolean;
  showSummary?: boolean;
  onHeaderDiscountChange: (v: number) => void;
  onIncQty: (variantId: number) => void;
  onDecQty: (variantId: number) => void;
  onRemoveLine: (variantId: number) => void;
};

function lineTotal(line: PosCartLine): number {
  return Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
}

export function PosCartPanel({
  lines,
  headerDiscount,
  compact = false,
  showSummary = true,
  onHeaderDiscountChange,
  onIncQty,
  onDecQty,
  onRemoveLine,
}: PosCartPanelProps) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const total = Math.max(0, subtotal - headerDiscount);

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className={cn("pb-3", compact && "pb-2") }>
        <CardTitle className="text-lg">Giỏ hàng</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className={cn("flex-1 overflow-auto rounded-md border border-[hsl(var(--pos-border))]", compact ? "min-h-0" : "min-h-[34dvh]")}>
          {lines.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">Chưa có sản phẩm. Quét barcode để bắt đầu.</div>
          ) : (
            <div className="divide-y">
              {lines.map((line) => (
                <div key={line.variantId} className={cn("p-3", compact && "p-2") }>
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("space-y-1", compact && "space-y-0.5")}>
                      <p className={cn("text-base font-semibold leading-tight", compact && "text-sm")}>{displayVariantName(line)}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Mã SKU: {line.sku}</span>
                        <Badge
                          className={compact ? "px-2 py-0 text-[11px]" : undefined}
                          variant={line.availableQty != null && line.availableQty <= 0 ? "destructive" : "secondary"}
                        >
                          {line.availableQty == null ? "Tồn: N/A" : `Tồn: ${line.availableQty}`}
                        </Badge>
                        <span>{formatVndFromDecimal(line.unitPrice)}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn("h-11 w-11", compact && "h-8 w-8")}
                      onClick={() => onRemoveLine(line.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className={cn("mt-2 flex items-center justify-between", compact && "mt-1")}>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className={cn("h-11 w-11", compact && "h-9 w-9")} onClick={() => onDecQty(line.variantId)}>
                        -
                      </Button>
                      <div className={cn("grid h-11 min-w-12 place-items-center rounded-md border px-3 text-sm font-semibold", compact && "h-9 min-w-10 px-2")}>
                        {line.quantity}
                      </div>
                      <Button type="button" variant="outline" className={cn("h-11 w-11", compact && "h-9 w-9")} onClick={() => onIncQty(line.variantId)}>
                        +
                      </Button>
                    </div>
                    <p className={cn("text-lg font-semibold tabular-nums", compact && "text-base")}>{formatVndFromDecimal(lineTotal(line))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showSummary ? (
          <div className={cn("overflow-hidden rounded-md border border-[hsl(var(--pos-border))] p-3", compact && "p-2")}>
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">Giảm giá đơn</label>
          <Input
            type="number"
            min={0}
            value={headerDiscount}
            onChange={(e) => onHeaderDiscountChange(Math.max(0, Number(e.target.value) || 0))}
            className="h-11"
          />
          <div className={cn("mt-3 space-y-1 text-sm", compact && "mt-2") }>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-medium tabular-nums">{formatVndFromDecimal(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className="font-medium tabular-nums">{formatVndFromDecimal(headerDiscount)}</span>
            </div>
            <div className={cn("mt-2 flex items-end justify-between border-t pt-2", compact && "mt-1 pt-1") }>
              <span className="text-lg font-bold leading-none">Tổng cộng</span>
              <span className="text-2xl font-bold leading-none tabular-nums text-[hsl(var(--pos-primary))] sm:text-3xl">
                {formatVndFromDecimal(total)}
              </span>
            </div>
          </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
