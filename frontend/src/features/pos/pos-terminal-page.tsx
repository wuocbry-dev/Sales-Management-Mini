import { useEffect, useMemo, useReducer, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchInventoryAvailability } from "@/api/inventory-api";
import { confirmSalesOrder, createSalesOrderDraft } from "@/api/sales-orders-api";
import { BarcodeScannerInput } from "@/components/catalog/barcode-scanner-input";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/auth-store";
import { isFrontlineCashierNav, isStoreManagerRole, isSystemManage } from "@/features/auth/access";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { formatApiError } from "@/lib/api-errors";
import { usePosScopeStore } from "@/features/pos/pos-scope-store";
import { PosCartPanel } from "@/features/pos/components/pos-cart-panel";
import { PosPaymentPanel } from "@/features/pos/components/pos-payment-panel";
import {
  lineTotal,
  posInitialState,
  posMachineReducer,
  toDraftPayload,
  toPaymentLines,
} from "@/features/pos/pos-machine";
import { displayVariantName, toPosCartLine, type PosCartLine } from "@/features/pos/types";
import type { ProductVariantOptionResponse } from "@/types/product";
import type { SalesOrderResponse } from "@/types/sales-order";

type FlowStep = 1 | 2 | 3 | 4;

function isManager(me: ReturnType<typeof useAuthStore.getState>["me"]): boolean {
  if (!me) return false;
  return isStoreManagerRole(me) || isSystemManage(me);
}

export function PosTerminalPage() {
  const me = useAuthStore((s) => s.me);
  const selectedStoreId = usePosScopeStore((s) => s.selectedStoreId);
  const selectedBranchId = usePosScopeStore((s) => s.selectedBranchId);
  const setSelectedStoreId = usePosScopeStore((s) => s.setSelectedStoreId);
  const setSelectedBranchId = usePosScopeStore((s) => s.setSelectedBranchId);

  const manager = isManager(me);
  const isCashier = isFrontlineCashierNav(me);

  const fallbackStoreId = me?.defaultStoreId ?? me?.storeIds?.[0] ?? 0;
  const lockedStoreId = !manager ? fallbackStoreId : 0;
  const lockedBranchId = !manager ? ((me?.branchIds?.length ?? 0) === 1 ? (me?.branchIds?.[0] ?? null) : null) : null;
  const storeId = manager ? (selectedStoreId ?? fallbackStoreId) : lockedStoreId;
  const branchId = manager ? (selectedBranchId ?? null) : lockedBranchId;

  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [manualVariantId, setManualVariantId] = useState(0);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [readyForPayment, setReadyForPayment] = useState(false);
  const [machine, dispatch] = useReducer(posMachineReducer, posInitialState);
  const [completedOrder, setCompletedOrder] = useState<SalesOrderResponse | null>(null);

  const { stores } = useStoreNameMap({ enabled: manager });

  const branchesQ = useQuery({
    queryKey: ["pos", "branches", storeId],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 200 }),
    enabled: storeId > 0,
  });

  const branches = branchesQ.data?.content ?? [];
  const step1Ready = storeId > 0 && (!isCashier || branchId != null);
  const variantIds = useMemo(() => Array.from(new Set(lines.map((l) => l.variantId))), [lines]);

  const stockByVariantQ = useQuery({
    queryKey: ["pos", "stock-by-variant", storeId, branchId, variantIds.join("-")],
    enabled: storeId > 0 && variantIds.length > 0,
    queryFn: async () => {
      const results = await Promise.allSettled(
        variantIds.map(async (variantId) => fetchInventoryAvailability(storeId, variantId)),
      );

      const out = new Map<number, number>();
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const payload = r.value;

        const scoped = payload.locations.filter((loc) =>
          branchId == null ? loc.branchId == null : loc.branchId === branchId,
        );
        const qty = scoped.reduce((sum, loc) => {
          const n = Number(loc.quantityOnHand);
          return Number.isFinite(n) ? sum + n : sum;
        }, 0);
        out.set(payload.variantId, qty);
      }
      return out;
    },
  });

  useEffect(() => {
    if (manager) return;
    const nextStoreId = lockedStoreId > 0 ? lockedStoreId : null;
    if (selectedStoreId !== nextStoreId) {
      setSelectedStoreId(nextStoreId);
    }
    if (selectedBranchId !== lockedBranchId) {
      setSelectedBranchId(lockedBranchId);
    }
  }, [manager, lockedStoreId, lockedBranchId, selectedStoreId, selectedBranchId, setSelectedStoreId, setSelectedBranchId]);

  useEffect(() => {
    if (!stockByVariantQ.data) return;
    setLines((prev) => {
      let changed = false;
      const next = prev.map((line) => {
        const qty = stockByVariantQ.data.get(line.variantId);
        const nextAvailable = typeof qty === "number" ? qty : null;
        if (line.availableQty === nextAvailable) {
          return line;
        }
        changed = true;
        return { ...line, availableQty: nextAvailable };
      });
      return changed ? next : prev;
    });
  }, [stockByVariantQ.data]);

  const flowStep: FlowStep = !scopeConfirmed ? 1 : completedOrder ? 4 : readyForPayment ? 3 : 2;

  const checkoutM = useMutation({
    mutationFn: async () => {
      if (!me) {
        throw new Error("Chưa đăng nhập.");
      }
      if (!storeId || storeId <= 0) {
        throw new Error("Thiếu cửa hàng vận hành POS.");
      }
      if (isCashier && !branchId) {
        throw new Error("Nhân viên bán hàng chưa được gán chi nhánh.");
      }
      if (lines.length === 0) {
        throw new Error("Giỏ hàng đang trống.");
      }
      const amount = Math.max(0, lines.reduce((sum, l) => sum + lineTotal(l), 0) - headerDiscount);
      if (cashReceived < amount) {
        throw new Error("Số tiền khách đưa chưa đủ.");
      }
      const draft = await createSalesOrderDraft(
        toDraftPayload({
          storeId,
          branchId,
          lines,
          headerDiscountAmount: headerDiscount,
        }),
      );

      const confirmed = await confirmSalesOrder(
        draft.id,
        {
          payments: toPaymentLines({ totalAmount: amount }),
        },
      );

      return confirmed;
    },
  });

  useEffect(() => {
    if (checkoutM.isPending) {
      dispatch({ type: "PAYMENT" });
      return;
    }
    if (checkoutM.isSuccess) {
      dispatch({ type: "SUCCESS", message: "Checkout completed." });
      toast.success("Đã thanh toán thành công.");
      setCompletedOrder(checkoutM.data ?? null);
      return;
    }
    if (checkoutM.isError) {
      const msg = formatApiError(checkoutM.error);
      dispatch({ type: "ERROR", message: msg });
      toast.error(msg);
      return;
    }
  }, [checkoutM.isPending, checkoutM.isSuccess, checkoutM.isError]);

  useEffect(() => {
    if (machine.status !== "success") return;
    const t = window.setTimeout(() => dispatch({ type: "IDLE" }), 1200);
    return () => window.clearTimeout(t);
  }, [machine.status]);

  const addVariant = (v: ProductVariantOptionResponse) => {
    if (!step1Ready) {
      toast.error("Chọn cửa hàng và chi nhánh trước khi thêm sản phẩm.");
      return;
    }
    dispatch({ type: "SCANNING" });
    setLines((prev) => {
      const idx = prev.findIndex((x) => x.variantId === v.variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, toPosCartLine(v)];
    });
    window.setTimeout(() => dispatch({ type: "IDLE" }), 300);
  };

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Math.max(0, l.quantity * l.unitPrice - l.discountAmount), 0),
    [lines],
  );
  const total = Math.max(0, subtotal - headerDiscount);
  const changeAmount = Math.max(0, cashReceived - total);

  useEffect(() => {
    setCashReceived((prev) => (prev < total ? total : prev));
  }, [total]);

  const resetForNextSale = () => {
    setLines([]);
    setHeaderDiscount(0);
    setCashReceived(0);
    setManualVariantId(0);
    setCompletedOrder(null);
    setReadyForPayment(false);
    checkoutM.reset();
    dispatch({ type: "IDLE" });
  };

  const printReceipt = (order: SalesOrderResponse) => {
    const w = window.open("", "_blank", "width=420,height=720");
    if (!w) {
      toast.error("Không mở được cửa sổ in. Vui lòng cho phép pop-up.");
      return;
    }

    // Get store name
    const storeName = stores.find((s) => s.id === order.storeId)?.storeName ?? `Cửa hàng #${order.storeId}`;
    
    // Translate status
    const statusMap: Record<string, string> = {
      draft: "Nháp",
      completed: "Hoàn thành",
      cancelled: "Hủy",
      confirmed: "Xác nhận",
    };
    const translatedStatus = statusMap[order.status?.toLowerCase()] ?? order.status;
    
    // Translate payment status
    const paymentStatusMap: Record<string, string> = {
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      partial: "Thanh toán một phần",
      refunded: "Hoàn tiền",
    };
    const translatedPaymentStatus = paymentStatusMap[order.paymentStatus?.toLowerCase()] ?? order.paymentStatus;

    // Format currency helper
    const formatCurrency = (value: string | number): string => {
      if (value == null || value === "") return "0 ₫";
      const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
      if (Number.isNaN(n)) return "0 ₫";
      const rounded = Math.round(n);
      return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
    };

    const lineNameMap = new Map<number, string>(
      lines.map((l) => [l.variantId, displayVariantName(l)]),
    );
    const paid = Number(order.paidAmount);
    const totalAmount = Number(order.totalAmount);
    const change = Number.isFinite(paid) && Number.isFinite(totalAmount) ? Math.max(0, paid - totalAmount) : 0;

    const lineRows = order.items
      .map(
        (it) => `
          <tr>
            <td style="padding:6px;border-bottom:1px solid #ddd;">
              <div style="font-weight:600;">${lineNameMap.get(it.variantId) ?? `Biến thể #${it.variantId}`}</div>
            </td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center;">${it.quantity}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right;">${formatCurrency(it.lineTotal)}</td>
          </tr>`,
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hóa đơn ${order.orderCode}</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 16px; color:#111;">
          <div style="border-bottom:1px dashed #999; padding-bottom:8px; margin-bottom:8px;">
            <h2 style="margin:0 0 4px 0; font-size:16px;">Hóa đơn bán hàng</h2>
            <p style="margin:2px 0;"><strong>Cửa hàng:</strong> ${storeName}</p>
            <p style="margin:2px 0;"><strong>Chi nhánh:</strong> ${order.branchId == null ? "Kho tổng" : `Chi nhánh #${order.branchId}`}</p>
          </div>

          <div style="border-bottom:1px dashed #999; padding-bottom:8px; margin-bottom:8px;">
            <p style="margin:2px 0;"><strong>Mã đơn:</strong> ${order.orderCode}</p>
            <p style="margin:2px 0;"><strong>Ngày:</strong> ${new Date(order.orderDate).toLocaleString("vi-VN")}</p>
            <p style="margin:2px 0;"><strong>Trạng thái:</strong> ${translatedStatus}</p>
            <p style="margin:2px 0;"><strong>Thanh toán:</strong> ${translatedPaymentStatus}</p>
          </div>

          <div style="margin-bottom:8px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:8px; font-size:13px;">
            <thead>
              <tr>
                <th style="text-align:left; padding:6px; border-bottom:1px solid #aaa;">Sản phẩm</th>
                <th style="text-align:center; padding:6px; border-bottom:1px solid #aaa;">SL</th>
                <th style="text-align:right; padding:6px; border-bottom:1px solid #aaa;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${lineRows}</tbody>
            </table>
          </div>

          <div style="border-top:1px dashed #999; border-bottom:1px dashed #999; padding:8px 0; margin-bottom:8px; font-size:13px;">
            <table style="width:100%; border-collapse:collapse;">
              <tr style="height:24px;">
                <td style="padding:2px 6px; text-align:left;"><strong>Tạm tính:</strong></td>
                <td style="padding:2px 6px; text-align:right; font-family:monospace;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr style="height:24px;">
                <td style="padding:2px 6px; text-align:left;"><strong>Giảm giá:</strong></td>
                <td style="padding:2px 6px; text-align:right; font-family:monospace;">${formatCurrency(order.discountAmount)}</td>
              </tr>
              <tr style="height:26px; border-top:1px solid #ddd; border-bottom:1px solid #ddd;">
                <td style="padding:4px 6px; text-align:left; font-weight:bold; font-size:14px;">Tổng tiền:</td>
                <td style="padding:4px 6px; text-align:right; font-weight:bold; font-size:14px; font-family:monospace;">${formatCurrency(order.totalAmount)}</td>
              </tr>
              <tr style="height:24px;">
                <td style="padding:2px 6px; text-align:left;"><strong>Khách đưa:</strong></td>
                <td style="padding:2px 6px; text-align:right; font-family:monospace;">${formatCurrency(order.paidAmount)}</td>
              </tr>
              <tr style="height:24px;">
                <td style="padding:2px 6px; text-align:left;"><strong>Tiền thối:</strong></td>
                <td style="padding:2px 6px; text-align:right; font-family:monospace;">${formatCurrency(change)}</td>
              </tr>
            </table>
          </div>

          <div style="font-size:12px;">
            <p style="margin:2px 0;">Nhân viên: ${me?.fullName ?? me?.username ?? "N/A"}</p>
            <p style="margin:2px 0;">In lúc: ${new Date().toLocaleString("vi-VN")}</p>
            <p style="margin:6px 0 0 0; text-align:center; font-weight:600;">Cảm ơn quý khách!</p>
          </div>
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 120);
              window.onafterprint = function () {
                window.close();
              };
            });
          </script>
        </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
  };

  const finalizeStep4 = (shouldPrint: boolean) => {
    if (completedOrder && shouldPrint) {
      printReceipt(completedOrder);
    }
    resetForNextSale();
    toast.success("Đã quay về màn hình bán hàng.");
  };

  const flowLabels: Array<{ step: FlowStep; label: string }> = [
    { step: 1, label: "1. Chọn cửa hàng / chi nhánh" },
    { step: 2, label: "2. Nhập sản phẩm" },
    { step: 3, label: "3. Tạm tính / tiền thối" },
    { step: 4, label: "4-5. In hóa đơn / quay về" },
  ];

  return (
    <div className="space-y-3">
      <Card className="pos-panel">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          {flowLabels.map((x) => (
            <Badge key={x.step} variant={flowStep >= x.step ? "default" : "muted"}>
              {x.label}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {flowStep === 1 ? (
        <Card className="pos-panel">
          <CardHeader>
            <CardTitle>Bước 1: Chọn cửa hàng và chi nhánh</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:max-w-xl">
            <label className="text-sm font-medium text-muted-foreground">
              Cửa hàng
              <select
                className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                value={storeId > 0 ? String(storeId) : ""}
                disabled={!manager}
                onChange={(e) => {
                  setSelectedStoreId(Number(e.target.value) || null);
                  setSelectedBranchId(null);
                  setScopeConfirmed(false);
                  resetForNextSale();
                }}
              >
                <option value="">Chọn cửa hàng</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Chi nhánh
              <select
                className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                value={branchId != null ? String(branchId) : ""}
                disabled={!manager || storeId <= 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSelectedBranchId(Number.isFinite(v) && v > 0 ? v : null);
                  setScopeConfirmed(false);
                  resetForNextSale();
                }}
              >
                <option value="">Kho tổng</option>
                {branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              disabled={!step1Ready}
              onClick={() => {
                setScopeConfirmed(true);
                toast.success("Đã xác nhận phạm vi bán hàng.");
              }}
            >
              Tiếp tục nhập sản phẩm
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {flowStep === 2 ? (
        <div className="grid h-[calc(100dvh-12.5rem)] min-h-[640px] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden">
          <Card className="pos-panel h-fit shrink-0">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-sm">Bước 2: Nhập sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 pb-3">
              <BarcodeScannerInput compact storeId={storeId} disabled={storeId <= 0} onFound={addVariant} />
              <div className="rounded-md border border-[hsl(var(--pos-border))] p-2">
                <VariantSearchCombobox
                  apiNamespace="pos"
                  storeId={storeId}
                  value={manualVariantId}
                  onChange={setManualVariantId}
                  onPick={addVariant}
                  labelMode="product-variant"
                  placeholder="Tên sản phẩm + tên biến thể"
                  disabled={storeId <= 0}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Trong giỏ: <span className="font-semibold text-foreground">{lines.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="min-h-0 space-y-2">
            <PosCartPanel
              compact
              showSummary={false}
              lines={lines}
              headerDiscount={headerDiscount}
              onHeaderDiscountChange={setHeaderDiscount}
              onIncQty={(variantId) =>
                setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l)))
              }
              onDecQty={(variantId) =>
                setLines((prev) =>
                  prev
                    .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l))
                    .filter((l) => l.quantity > 0),
                )
              }
              onRemoveLine={(variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId))}
            />
          </div>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-destructive text-destructive"
              disabled={lines.length === 0}
              onClick={() => {
                setLines([]);
                setHeaderDiscount(0);
                setCashReceived(0);
                setManualVariantId(0);
                toast.success("Đã làm mới giỏ hàng.");
              }}
            >
              Xoá hết sản phẩm
            </Button>
          <Button
            type="button"
            className="h-12 w-full text-base font-semibold"
            disabled={lines.length === 0}
            onClick={() => setReadyForPayment(true)}
          >
            Tiếp tục tính tiền
          </Button>
        </div>
      ) : null}

      {flowStep === 3 ? (
        <div className="space-y-3">
          <PosPaymentPanel
            lineCount={lines.length}
            totalAmount={total}
            cashReceived={cashReceived}
            changeAmount={changeAmount}
            posStatus={machine.status}
            statusMessage={machine.message}
            showCancel={false}
            onCashReceivedChange={setCashReceived}
            onComplete={() => {
              checkoutM.mutate();
            }}
            onHold={() => {
              dispatch({ type: "IDLE" });
              toast.info("Đơn đã được tạm giữ (skeleton). Hook API hold-order sau.");
            }}
            onBackToInput={() => setReadyForPayment(false)}
            onCancel={() => {
              resetForNextSale();
              toast.success("Đơn hàng đã xóa.");
            }}
          />
        </div>
      ) : null}

      {flowStep === 4 && completedOrder ? (
        <Card className="pos-panel">
          <CardHeader>
            <CardTitle>Bước 4: In hóa đơn?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Đơn {completedOrder.orderCode} đã thanh toán thành công. Bạn có muốn in hóa đơn không?
            </p>
            <div className="grid max-w-xl grid-cols-2 gap-2">
              <Button type="button" onClick={() => finalizeStep4(true)}>Có, in hóa đơn</Button>
              <Button type="button" variant="outline" onClick={() => finalizeStep4(false)}>Không in</Button>
            </div>
            <Button type="button" variant="secondary" className="max-w-xl" onClick={() => finalizeStep4(false)}>
              Bước 5: Quay về trang bán hàng
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
