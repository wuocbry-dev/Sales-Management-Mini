import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { displayVariantName, type PosCartLine } from "@/features/pos/types";

type PosCartPanelProps = {
  lines: PosCartLine[];
  headerDiscount: number;
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
  onHeaderDiscountChange,
  onIncQty,
  onDecQty,
  onRemoveLine,
}: PosCartPanelProps) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const total = Math.max(0, subtotal - headerDiscount);

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Giỏ hàng</CardTitle>
          <Badge variant="secondary">Mặt hàng: {lines.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-[34dvh] flex-1 overflow-auto rounded-md border border-[hsl(var(--pos-border))]">
          {lines.length === 0 ? (
            <div className="grid h-40 place-items-center px-4 text-center text-sm text-muted-foreground">
              Chưa có sản phẩm trong giỏ. Hãy quét mã vạch hoặc chọn nhanh từ danh mục bên phải.
            </div>
          ) : (
            <div className="divide-y">
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_132px_124px] gap-2 border-b bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Sản phẩm</span>
                <span className="text-center">Số lượng</span>
                <span className="text-right">Thành tiền</span>
              </div>
              {lines.map((line) => (
                <div key={line.variantId} className="grid grid-cols-[minmax(0,1fr)_132px_124px] items-center gap-2 p-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{displayVariantName(line)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="-mr-2 h-9 w-9 shrink-0"
                        onClick={() => onRemoveLine(line.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">SKU: {line.sku}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={line.availableQty != null && line.availableQty <= 0 ? "destructive" : "secondary"}>
                        {line.availableQty == null ? "Tồn kho: Không rõ" : `Tồn kho: ${line.availableQty}`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatVndFromDecimal(line.unitPrice)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1">
                    <Button type="button" variant="outline" className="h-10 w-10" onClick={() => onDecQty(line.variantId)}>
                      -
                    </Button>
                    <div className="grid h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold">{line.quantity}</div>
                    <Button type="button" variant="outline" className="h-10 w-10" onClick={() => onIncQty(line.variantId)}>
                      +
                    </Button>
                  </div>

                  <p className="text-right text-base font-semibold tabular-nums">{formatVndFromDecimal(lineTotal(line))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-md border border-[hsl(var(--pos-border))] p-3">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">Giảm giá đơn hàng</label>
          <Input
            type="number"
            min={0}
            value={headerDiscount}
            onChange={(e) => onHeaderDiscountChange(Math.max(0, Number(e.target.value) || 0))}
            className="h-11"
          />
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-medium tabular-nums">{formatVndFromDecimal(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className="font-medium tabular-nums">{formatVndFromDecimal(headerDiscount)}</span>
            </div>
            <div className="mt-2 flex items-end justify-between border-t pt-2">
              <span className="text-lg font-bold leading-none">Khách cần trả</span>
              <span className="text-2xl font-bold leading-none tabular-nums text-[hsl(var(--pos-primary))] sm:text-3xl">
                {formatVndFromDecimal(total)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
