import { useEffect, useMemo, useReducer, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchBranchesForStore } from "@/api/branches-api";
import { confirmSalesOrder, createSalesOrderDraft } from "@/api/sales-orders-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { isFrontlineCashierNav, isStoreManagerRole, isSystemManage } from "@/features/auth/access";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { formatApiError } from "@/lib/api-errors";
import { usePosScopeStore } from "@/features/pos/pos-scope-store";
import { PosCartPanel } from "@/features/pos/components/pos-cart-panel";
import { PosCatalogPanel } from "@/features/pos/components/pos-catalog-panel";
import { PosLayoutShell } from "@/features/pos/components/pos-layout-shell";
import { PosPaymentPanel } from "@/features/pos/components/pos-payment-panel";
import {
  lineTotal,
  posInitialState,
  posMachineReducer,
  toDraftPayload,
  toPaymentLines,
} from "@/features/pos/pos-machine";
import { PosSessionBar } from "@/features/pos/components/pos-session-bar";
import { toPosCartLine, type PosCartLine } from "@/features/pos/types";
import type { ProductVariantOptionResponse } from "@/types/product";

type PaymentMethod = "cash" | "card" | "bank" | "qr";

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
  const cashierName = me?.fullName ?? me?.username ?? "Cashier";

  const fallbackStoreId = me?.defaultStoreId ?? me?.storeIds?.[0] ?? 0;
  const lockedStoreId = !manager ? fallbackStoreId : 0;
  const lockedBranchId = !manager ? ((me?.branchIds?.length ?? 0) === 1 ? (me?.branchIds?.[0] ?? null) : null) : null;
  const storeId = manager ? (selectedStoreId ?? fallbackStoreId) : lockedStoreId;
  const branchId = manager ? (selectedBranchId ?? null) : lockedBranchId;

  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [machine, dispatch] = useReducer(posMachineReducer, posInitialState);

  const { stores } = useStoreNameMap({ enabled: manager });

  const branchesQ = useQuery({
    queryKey: ["pos", "branches", storeId],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 200 }),
    enabled: storeId > 0,
  });

  const branches = branchesQ.data?.content ?? [];

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
      const draft = await createSalesOrderDraft(
        toDraftPayload({
          storeId,
          branchId,
          lines,
          headerDiscountAmount: headerDiscount,
        }),
      );

      const amount = Math.max(0, lines.reduce((sum, l) => sum + lineTotal(l), 0) - headerDiscount);
      const confirmed = await confirmSalesOrder(
        draft.id,
        {
          payments: toPaymentLines({ method: paymentMethod, totalAmount: amount }),
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
      setLines([]);
      setHeaderDiscount(0);
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

  return (
    <PosLayoutShell
      sessionBar={
        <PosSessionBar
          cashierName={cashierName}
          storeId={storeId}
          branchId={branchId}
          stores={stores}
          branches={branches}
          canPickStore={manager}
          canPickBranch={manager && storeId > 0}
          onStoreChange={(id) => {
            setSelectedStoreId(id > 0 ? id : null);
            setSelectedBranchId(null);
          }}
          onBranchChange={(id) => setSelectedBranchId(id)}
          onScanned={addVariant}
        />
      }
      cartPanel={
        <PosCartPanel
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
      }
      catalogPanel={<PosCatalogPanel storeId={storeId} onPickVariant={addVariant} />}
      paymentPanel={
        <PosPaymentPanel
          lineCount={lines.length}
          totalAmount={total}
          selectedMethod={paymentMethod}
          posStatus={machine.status}
          statusMessage={machine.message}
          onMethodChange={setPaymentMethod}
          onComplete={() => {
            checkoutM.mutate();
          }}
          onHold={() => {
            dispatch({ type: "IDLE" });
            toast.info("Đơn đã được tạm giữ (skeleton). Hook API hold-order sau.");
          }}
          onCancel={() => {
            setLines([]);
            setHeaderDiscount(0);
            dispatch({ type: "IDLE" });
            toast.success("Order cleared.");
          }}
        />
      }
    />
  );
}
