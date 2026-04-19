import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  ClipboardList,
  CreditCard,
  QrCode,
  Search,
  ShoppingCart,
  Store,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createCustomer } from "@/api/customers-api";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { fetchInventoryAvailability } from "@/api/inventory-api";
import {
  fetchPosVariantByBarcode,
  fetchPosVariantSearch,
  fetchProductImageBlobUrl,
  fetchProductsPage,
} from "@/api/products-api";
import { confirmSalesOrder, createSalesOrderDraft } from "@/api/sales-orders-api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/auth-store";
import { isFrontlineCashierNav, isStoreManagerRole, isSystemManage } from "@/features/auth/access";
import {
  lineTotal,
  posInitialState,
  posMachineReducer,
  toDraftPayload,
  toPaymentLines,
} from "@/features/pos/pos-machine";
import { usePosScopeStore } from "@/features/pos/pos-scope-store";
import { displayVariantName, toPosCartLine, type PosCartLine } from "@/features/pos/types";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { formatApiError } from "@/lib/api-errors";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { InventoryAvailabilityResponse } from "@/types/inventory";
import type { CategoryResponse } from "@/types/master-data";
import type { ProductResponse, ProductVariantOptionResponse } from "@/types/product";
import type { SalesOrderResponse } from "@/types/sales-order";
import type { CustomerRequestBody } from "@/types/customer";

type PaymentMethod = "CASH" | "CARD" | "EWALLET";

type CatalogVariant = ProductVariantOptionResponse & {
  categoryId: number | null;
  imageUrl: string | null;
};

const QUICK_CASH_VALUES = [10000, 20000, 50000, 100000, 200000, 500000] as const;

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "CARD", label: "Thẻ/Bank" },
  { value: "EWALLET", label: "QR Pay" },
];

function isManager(me: ReturnType<typeof useAuthStore.getState>["me"]): boolean {
  if (!me) return false;
  return isStoreManagerRole(me) || isSystemManage(me);
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCashInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.trunc(value));
}

function parseCashInput(value: string): number {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (!digitsOnly) return 0;
  return Math.max(0, Number.parseInt(digitsOnly, 10) || 0);
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const pieces = trimmed.split(/\s+/).filter(Boolean);
  if (pieces.length === 1) {
    return pieces[0].slice(0, 2).toUpperCase();
  }
  return `${pieces[0][0] ?? ""}${pieces[pieces.length - 1][0] ?? ""}`.toUpperCase();
}

function sumScopedQty(payload: InventoryAvailabilityResponse, branchId: number | null): number {
  const scoped = payload.locations.filter((loc) =>
    branchId == null ? loc.branchId == null : loc.branchId === branchId,
  );
  return scoped.reduce((sum, loc) => {
    const qty = Number(loc.quantityOnHand);
    return Number.isFinite(qty) ? sum + qty : sum;
  }, 0);
}

function paymentMethodIcon(method: PaymentMethod) {
  if (method === "CARD") {
    return <CreditCard className="h-4 w-4" aria-hidden />;
  }
  if (method === "EWALLET") {
    return <QrCode className="h-4 w-4" aria-hidden />;
  }
  return <Wallet className="h-4 w-4" aria-hidden />;
}

function flattenVariants(rows: ProductResponse[]): CatalogVariant[] {
  const out: CatalogVariant[] = [];
  for (const product of rows) {
    const imageUrl = product.images?.[0]?.imageUrl ?? null;
    for (const variant of product.variants) {
      if ((variant.status ?? "").trim().toUpperCase() === "INACTIVE") {
        continue;
      }
      out.push({
        variantId: variant.id,
        sku: variant.sku,
        variantName: variant.variantName,
        productName: product.productName,
        sellingPrice: variant.sellingPrice,
        categoryId: product.categoryId,
        imageUrl,
      });
    }
  }
  return out;
}

function selectedBranchLabel(branchId: number | null, branches: Array<{ branchId: number; branchName: string }>): string {
  if (branchId == null) return "Kho tổng";
  const found = branches.find((b) => b.branchId === branchId);
  return found?.branchName ?? `Chi nhánh #${branchId}`;
}

export function PosTerminalPage() {
  const navigate = useNavigate();
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
  const scopeReady = storeId > 0 && (!isCashier || branchId != null);

  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [scanCode, setScanCode] = useState("");
  const [catalogKeyword, setCatalogKeyword] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [machine, dispatch] = useReducer(posMachineReducer, posInitialState);
  const [completedOrder, setCompletedOrder] = useState<SalesOrderResponse | null>(null);
  const receiptTenderedAmountRef = useRef<number | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerRequestBody>({
    customerCode: "",
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    status: "ACTIVE",
  });

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const headerDiscount = 0;

  const { stores, getStoreName } = useStoreNameMap();

  const branchesQ = useQuery({
    queryKey: ["pos", "branches", storeId],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 200 }),
    enabled: storeId > 0,
    staleTime: 60_000,
  });

  const categoriesQ = useQuery({
    queryKey: ["pos", "categories", storeId],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 120, storeId }),
    enabled: storeId > 0,
    staleTime: 60_000,
  });

  const productsQ = useQuery({
    queryKey: ["pos", "catalog-products", storeId, activeCategoryId, catalogKeyword.trim()],
    enabled: storeId > 0,
    queryFn: () =>
      fetchProductsPage({
        page: 0,
        size: 60,
        status: "ACTIVE",
        ...(activeCategoryId != null ? { categoryId: activeCategoryId } : {}),
        ...(catalogKeyword.trim() ? { q: catalogKeyword.trim() } : {}),
      }),
    staleTime: 20_000,
  });

  const categories = useMemo(() => {
    const input = categoriesQ.data?.content ?? [];
    return input.filter((item) => (item.status ?? "").trim().toUpperCase() !== "INACTIVE");
  }, [categoriesQ.data]);

  useEffect(() => {
    if (activeCategoryId == null) return;
    const exists = categories.some((item) => item.id === activeCategoryId);
    if (!exists) {
      setActiveCategoryId(null);
    }
  }, [activeCategoryId, categories]);

  const catalogVariants = useMemo(() => {
    const rows = productsQ.data?.content ?? [];
    return flattenVariants(rows).slice(0, 24);
  }, [productsQ.data]);

  const catalogImageSources = useMemo(() => {
    return Array.from(new Set(catalogVariants.map((row) => row.imageUrl).filter((x): x is string => Boolean(x))));
  }, [catalogVariants]);

  const catalogImagesQ = useQuery({
    queryKey: ["pos", "catalog-image-blobs", catalogImageSources.join("|")],
    enabled: catalogImageSources.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        catalogImageSources.map(async (imageUrl) => ({
          imageUrl,
          blobUrl: await fetchProductImageBlobUrl(imageUrl),
        })),
      );

      return settled
        .filter((item): item is PromiseFulfilledResult<{ imageUrl: string; blobUrl: string }> => item.status === "fulfilled")
        .map((item) => item.value);
    },
  });

  useEffect(() => {
    return () => {
      catalogImagesQ.data?.forEach((item) => URL.revokeObjectURL(item.blobUrl));
    };
  }, [catalogImagesQ.data]);

  const imageBlobBySource = useMemo(() => {
    const out = new Map<string, string>();
    for (const row of catalogImagesQ.data ?? []) {
      out.set(row.imageUrl, row.blobUrl);
    }
    return out;
  }, [catalogImagesQ.data]);

  const imageBlobByVariantId = useMemo(() => {
    const out = new Map<number, string>();
    for (const row of catalogVariants) {
      if (!row.imageUrl) continue;
      const blob = imageBlobBySource.get(row.imageUrl);
      if (blob) {
        out.set(row.variantId, blob);
      }
    }
    return out;
  }, [catalogVariants, imageBlobBySource]);

  const stockVariantIds = useMemo(
    () => Array.from(new Set([...lines.map((line) => line.variantId), ...catalogVariants.map((row) => row.variantId)])),
    [lines, catalogVariants],
  );

  const stockByVariantQ = useQuery({
    queryKey: ["pos", "stock-by-variant", storeId, branchId, stockVariantIds.join("-")],
    enabled: scopeReady && stockVariantIds.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        stockVariantIds.map(async (variantId) => fetchInventoryAvailability(storeId, variantId)),
      );
      const out = new Map<number, number>();
      for (const row of settled) {
        if (row.status !== "fulfilled") continue;
        out.set(row.value.variantId, sumScopedQty(row.value, branchId));
      }
      return out;
    },
  });

  useEffect(() => {
    if (manager) {
      // Manager always locked to their default store
      if (me?.defaultStoreId) {
        setSelectedStoreId(me.defaultStoreId);
      }
      setSelectedBranchId(null);
    }
    if (isCashier) {
      // Cashier always locked to their assigned branch
      if (me?.branchIds?.[0]) {
        setSelectedBranchId(me.branchIds[0]);
      }
    }
  }, [manager, isCashier, me, setSelectedStoreId, setSelectedBranchId]);

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

  useEffect(() => {
    if (!scopeReady) return;
    scannerInputRef.current?.focus();
  }, [scopeReady]);

  const selectedStoreName = getStoreName(storeId);
  const selectedBranchName = selectedBranchLabel(branchId, branchesQ.data?.content ?? []);
  
  // Display labels based on user role
  const displayStoreName = selectedStoreName || "Cửa hàng";
  const displayBranchName = !isCashier || branchId != null 
    ? selectedBranchName 
    : "Chọn chi nhánh";

  const scopeMessage = !storeId
    ? "Chọn cửa hàng trước khi bán hàng."
    : isCashier && !branchId
      ? "Tài khoản thu ngân cần được gán chi nhánh để bắt đầu bán hàng."
      : null;

  const totalItems = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const vatAmount = 0;
  const total = Math.max(0, subtotal - headerDiscount + vatAmount);
  const changeAmount = paymentMethod === "CASH" ? Math.max(0, cashReceived - total) : 0;

  useEffect(() => {
    if (paymentMethod !== "CASH") {
      setCashReceived(total);
      return;
    }
    setCashReceived((prev) => (prev < total ? total : prev));
  }, [paymentMethod, total]);

  const addVariant = (variant: ProductVariantOptionResponse) => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng và chi nhánh trước khi thêm sản phẩm.");
      return;
    }

    const availableQty = stockByVariantQ.data?.get(variant.variantId);
    const existing = lines.find((line) => line.variantId === variant.variantId);

    if (!existing && typeof availableQty === "number" && availableQty <= 0) {
      toast.error(`SKU ${variant.sku} đã hết hàng.`);
      return;
    }

    if (existing && typeof availableQty === "number" && existing.quantity >= availableQty) {
      toast.warning(`SKU ${variant.sku} đã đạt số lượng tồn hiện có.`);
      return;
    }

    dispatch({ type: "SCANNING" });

    setLines((prev) => {
      const idx = prev.findIndex((line) => line.variantId === variant.variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1,
          availableQty: typeof availableQty === "number" ? availableQty : next[idx].availableQty,
        };
        return next;
      }

      const nextLine: PosCartLine = {
        ...toPosCartLine(variant),
        availableQty: typeof availableQty === "number" ? availableQty : null,
      };
      return [...prev, nextLine];
    });

    window.setTimeout(() => dispatch({ type: "IDLE" }), 220);
  };

  const scanLookupM = useMutation({
    mutationFn: async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) {
        throw new Error("Vui lòng nhập mã SKU hoặc barcode.");
      }

      try {
        return await fetchPosVariantByBarcode({ storeId, barcode: code });
      } catch {
        const fallback = await fetchPosVariantSearch({ storeId, q: code });
        if (fallback.length > 0) {
          return fallback[0];
        }
        throw new Error("Không tìm thấy SKU hoặc barcode phù hợp.");
      }
    },
    onSuccess: (variant) => {
      addVariant(variant);
      setScanCode("");
      scannerInputRef.current?.focus();
    },
    onError: (err) => {
      const message = formatApiError(err);
      toast.error(message || "Không tìm thấy SKU hoặc barcode phù hợp.");
      scannerInputRef.current?.focus();
    },
  });

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

      const amount = Math.max(0, lines.reduce((sum, line) => sum + lineTotal(line), 0) - headerDiscount + vatAmount);
      if (paymentMethod === "CASH" && cashReceived < amount) {
        throw new Error("Số tiền khách đưa chưa đủ.");
      }
      receiptTenderedAmountRef.current = paymentMethod === "CASH" ? cashReceived : amount;

      const draft = await createSalesOrderDraft(
        toDraftPayload({
          storeId,
          branchId,
          lines,
          headerDiscountAmount: headerDiscount,
        }),
      );

      return confirmSalesOrder(draft.id, {
        payments: toPaymentLines({
          totalAmount: amount,
          paymentMethod,
        }),
      });
    },
  });

  useEffect(() => {
    if (checkoutM.isPending) {
      dispatch({ type: "PAYMENT" });
      return;
    }
    if (checkoutM.isSuccess) {
      dispatch({ type: "SUCCESS", message: "Thanh toán thành công." });
      setCompletedOrder(checkoutM.data ?? null);
      toast.success("Đã thanh toán thành công.");
      return;
    }
    if (checkoutM.isError) {
      const msg = formatApiError(checkoutM.error);
      dispatch({ type: "ERROR", message: msg });
      toast.error(msg);
    }
  }, [checkoutM.isPending, checkoutM.isSuccess, checkoutM.isError, checkoutM.data, checkoutM.error]);

  useEffect(() => {
    if (machine.status !== "success") return;
    const timer = window.setTimeout(() => dispatch({ type: "IDLE" }), 1400);
    return () => window.clearTimeout(timer);
  }, [machine.status]);

  const increaseQty = (variantId: number) => {
    const current = lines.find((line) => line.variantId === variantId);
    if (!current) return;

    const availableQty = stockByVariantQ.data?.get(variantId);
    if (typeof availableQty === "number" && current.quantity >= availableQty) {
      toast.warning("Đã đạt giới hạn tồn kho cho SKU này.");
      return;
    }

    setLines((prev) => prev.map((line) => (line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line)));
  };

  const decreaseQty = (variantId: number) => {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.variantId !== variantId) return [line];
        if (line.quantity <= 1) return [];
        return [{ ...line, quantity: line.quantity - 1 }];
      }),
    );
  };

  const removeLine = (variantId: number) => {
    setLines((prev) => prev.filter((line) => line.variantId !== variantId));
  };

  const resetForNextSale = () => {
    setLines([]);
    setScanCode("");
    setCashReceived(0);
    setPaymentMethod("CASH");
    setCompletedOrder(null);
    receiptTenderedAmountRef.current = null;
    checkoutM.reset();
    dispatch({ type: "IDLE" });
  };

  const runLookup = () => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng/chi nhánh trước khi tìm SKU.");
      return;
    }
    const code = scanCode.trim();
    if (!code) {
      toast.error("Vui lòng nhập SKU hoặc barcode để tìm.");
      return;
    }
    scanLookupM.mutate(code);
  };

  const printTemporaryBill = () => {
    if (lines.length === 0) {
      toast.error("Giỏ hàng đang trống.");
      return;
    }

    const popup = window.open("", "_blank", "width=420,height=720");
    if (!popup) {
      toast.error("Không mở được cửa sổ in. Vui lòng cho phép pop-up.");
      return;
    }

    const rows = lines
      .map(
        (line) => `
          <tr>
            <td style="padding:6px;border-bottom:1px solid #ddd;">
              <div style="font-weight:600;">${displayVariantName(line)}</div>
              <div style="font-size:11px;color:#6b7280;">SKU: ${line.sku}</div>
            </td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center;">${line.quantity}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right;">${formatVndFromDecimal(lineTotal(line))}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In tạm tính</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:16px;color:#111;">
          <h2 style="margin:0 0 6px 0;font-size:16px;">In tạm tính</h2>
          <p style="margin:2px 0;"><strong>Cửa hàng:</strong> ${selectedStoreName}</p>
          <p style="margin:2px 0;"><strong>Chi nhánh:</strong> ${selectedBranchName}</p>
          <p style="margin:2px 0 8px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:left;">Sản phẩm</th>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:center;">SL</th>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:10px;border-top:1px dashed #999;padding-top:8px;font-size:13px;">
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tạm tính:</span><strong>${formatVndFromDecimal(subtotal)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Chiết khấu:</span><strong>${formatVndFromDecimal(headerDiscount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Thuế VAT:</span><strong>${formatVndFromDecimal(vatAmount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:6px 0 0 0;font-size:15px;"><span><strong>Tổng cần trả:</strong></span><strong>${formatVndFromDecimal(total)}</strong></p>
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

    popup.document.write(html);
    popup.document.close();
  };

  const printReceipt = (order: SalesOrderResponse) => {
    const popup = window.open("", "_blank", "width=420,height=720");
    if (!popup) {
      toast.error("Không mở được cửa sổ in. Vui lòng cho phép pop-up.");
      return;
    }

    const storeName = getStoreName(order.storeId);
    const lineNameMap = new Map<number, string>(lines.map((line) => [line.variantId, displayVariantName(line)]));
    const orderPaid = toNumber(order.paidAmount);
    const hasCashPayment = order.payments.some((payment) => payment.paymentMethod?.trim().toUpperCase() === "CASH");
    const paid =
      hasCashPayment && receiptTenderedAmountRef.current != null
        ? Math.max(orderPaid, receiptTenderedAmountRef.current)
        : orderPaid;
    const totalAmount = toNumber(order.totalAmount);
    const change = Math.max(0, paid - totalAmount);

    const lineRows = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:6px;border-bottom:1px solid #ddd;">
              <div style="font-weight:600;">${lineNameMap.get(item.variantId) ?? `Biến thể #${item.variantId}`}</div>
            </td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;text-align:right;">${formatVndFromDecimal(item.lineTotal)}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hóa đơn ${order.orderCode}</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:16px;color:#111;">
          <h2 style="margin:0 0 6px 0;font-size:16px;">Hóa đơn bán hàng</h2>
          <p style="margin:2px 0;"><strong>Cửa hàng:</strong> ${storeName}</p>
          <p style="margin:2px 0;"><strong>Chi nhánh:</strong> ${order.branchId == null ? "Kho tổng" : `Chi nhánh #${order.branchId}`}</p>
          <p style="margin:2px 0;"><strong>Mã đơn:</strong> ${order.orderCode}</p>
          <p style="margin:2px 0 8px 0;"><strong>Ngày:</strong> ${new Date(order.orderDate).toLocaleString("vi-VN")}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:left;">Sản phẩm</th>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:center;">SL</th>
                <th style="padding:6px;border-bottom:1px solid #999;text-align:right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${lineRows}</tbody>
          </table>
          <div style="margin-top:10px;border-top:1px dashed #999;padding-top:8px;font-size:13px;">
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tạm tính:</span><strong>${formatVndFromDecimal(order.subtotal)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Giảm giá:</span><strong>${formatVndFromDecimal(order.discountAmount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tổng tiền:</span><strong>${formatVndFromDecimal(order.totalAmount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Khách đưa:</span><strong>${formatVndFromDecimal(paid)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tiền thối:</span><strong>${formatVndFromDecimal(change)}</strong></p>
          </div>
          <p style="margin:10px 0 0 0;font-size:12px;text-align:center;font-weight:600;">Cảm ơn quý khách!</p>
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

    popup.document.write(html);
    popup.document.close();
  };

  const machineLabel =
    machine.status === "payment"
      ? "Đang xử lý"
      : machine.status === "error"
        ? "Có lỗi"
        : machine.status === "success"
          ? "Thành công"
          : machine.status === "scanning"
            ? "Đang quét"
            : "Sẵn sàng";

  return (
    <div className="pos-v2-shell">
      <div className="pos-v2-topbar">
        <div className="pos-v2-topbar-row-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
            title="Quay lại giao diện quản lý"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="pos-v2-brand-box">
            <Store className="h-5 w-5 text-[#2563eb]" aria-hidden />
            <div>
              <p className="pos-v2-brand-title">Bán hàng POS</p>
              <p className="pos-v2-brand-subtitle">Quầy thu ngân</p>
            </div>
          </div>

          <div className="pos-v2-search-box">
            <input
              ref={scannerInputRef}
              type="text"
              value={scanCode}
              disabled={!scopeReady || scanLookupM.isPending}
              className="pos-v2-search-input"
              placeholder={scopeReady ? "Quét mã vạch hoặc nhập mã SKU..." : "Chọn cửa hàng/chi nhánh trước"}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runLookup();
                }
              }}
            />
            <Button type="button" className="pos-v2-search-btn" onClick={runLookup} disabled={!scopeReady || scanLookupM.isPending}>
              <Search className="h-4 w-4" aria-hidden />
              Tìm kiếm
            </Button>
            <button type="button" className="pos-v2-icon-btn" aria-label="Camera scan" disabled>
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="pos-v2-user-box">
            <div className="pos-v2-user-meta">
              <p className="pos-v2-user-name">{me?.fullName ?? me?.username ?? "Người dùng"}</p>
              <p className="pos-v2-user-shift">Ca sáng (08:00 - 16:00)</p>
            </div>
            <div className="pos-v2-avatar">{initialsFromName(me?.fullName ?? me?.username ?? "User")}</div>
          </div>
        </div>

        <div className="pos-v2-topbar-row-2">
          <div className="pos-v2-chip-row">
            <span className="pos-v2-pill pos-v2-pill-soft">{displayStoreName}</span>
            <span className="pos-v2-pill pos-v2-pill-soft">{displayBranchName}</span>
          </div>
        </div>
      </div>

      {scopeMessage ? (
        <div className="pos-v2-inline-warning" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <span>{scopeMessage}</span>
        </div>
      ) : null}

      {completedOrder ? (
        <div className="pos-v2-success-bar">
          <div>
            <p className="pos-v2-success-title">Đơn {completedOrder.orderCode} đã thanh toán thành công.</p>
            <p className="pos-v2-success-subtitle">Bạn có thể in hóa đơn ngay hoặc bắt đầu đơn mới.</p>
          </div>
          <div className="pos-v2-success-actions">
            <Button type="button" variant="outline" onClick={() => printReceipt(completedOrder)}>
              In hóa đơn
            </Button>
            <Button type="button" onClick={resetForNextSale}>
              Đơn mới
            </Button>
          </div>
        </div>
      ) : null}

      <div className="pos-v2-layout">
        <section className="pos-v2-cart-panel">
          <header className="pos-v2-panel-header">
            <h2>
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Giỏ hàng ({totalItems})
            </h2>
            <span className="pos-v2-panel-hint">{machineLabel}</span>
          </header>

          <div className="pos-v2-cart-list">
            {lines.length === 0 ? (
              <div className="pos-v2-empty-state">
                Chưa có sản phẩm trong giỏ. Quét mã vạch hoặc chọn SKU từ danh mục bên phải.
              </div>
            ) : (
              lines.map((line) => {
                const imageUrl = imageBlobByVariantId.get(line.variantId);
                return (
                  <article key={line.variantId} className="pos-v2-cart-item">
                    <div className="pos-v2-cart-thumb">
                      {imageUrl ? (
                        <img src={imageUrl} alt={displayVariantName(line)} loading="lazy" />
                      ) : (
                        <span>{line.sku.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="pos-v2-cart-content">
                      <p className="pos-v2-item-name">{displayVariantName(line)}</p>
                      <p className="pos-v2-item-meta">SKU: {line.sku}</p>
                      <p className="pos-v2-item-meta">
                        {line.availableQty == null
                          ? "Tồn: --"
                          : line.availableQty <= 0
                            ? "Tồn: Hết hàng"
                            : `Tồn: ${line.availableQty}`}
                      </p>
                    </div>

                    <div className="pos-v2-cart-price">{formatVndFromDecimal(line.unitPrice)}</div>

                    <div className="pos-v2-qty-control">
                      <button type="button" onClick={() => decreaseQty(line.variantId)} aria-label="Giảm số lượng">
                        -
                      </button>
                      <span>{line.quantity}</span>
                      <button type="button" onClick={() => increaseQty(line.variantId)} aria-label="Tăng số lượng">
                        +
                      </button>
                    </div>

                    <div className="pos-v2-cart-total">{formatVndFromDecimal(lineTotal(line))}</div>

                    <button
                      type="button"
                      className="pos-v2-remove-line"
                      onClick={() => removeLine(line.variantId)}
                      aria-label={`Xóa ${line.sku}`}
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                    </button>
                  </article>
                );
              })
            )}
          </div>

          <footer className="pos-v2-action-footer">
            <button type="button" className="pos-v2-footer-btn" onClick={resetForNextSale}>
              <Store className="h-4 w-4" aria-hidden />
              Đơn mới
            </button>
            <button
              type="button"
              className="pos-v2-footer-btn pos-v2-footer-btn-warn"
              onClick={() => toast.info("Đơn tạm sẽ được hỗ trợ sau khi có API giữ đơn.")}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Tạm giữ
            </button>
            <button
              type="button"
              className="pos-v2-footer-btn"
              onClick={() => toast.info("Tính năng mở đơn tạm sẽ được bật khi backend hỗ trợ.")}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Mở đơn tạm
            </button>
            <button
              type="button"
              className="pos-v2-footer-btn pos-v2-footer-btn-danger"
              onClick={() => {
                setLines([]);
                setCompletedOrder(null);
                toast.success("Đã hủy đơn hiện tại.");
              }}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Hủy đơn
            </button>
            <button type="button" className="pos-v2-footer-btn" onClick={printTemporaryBill}>
              <ClipboardList className="h-4 w-4" aria-hidden />
              In tạm tính
            </button>
          </footer>
        </section>

        <section className="pos-v2-right-column">
          <div className="pos-v2-catalog-panel">
            <button
              type="button"
              className="pos-v2-select-products-btn"
              onClick={() => setShowCatalogModal(true)}
              disabled={!scopeReady}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              Chọn sản phẩm
            </button>
          </div>

          <div className="pos-v2-payment-panel">
            <div className="pos-v2-payment-head">
              <h3>
                <User className="h-4 w-4" aria-hidden />
                Khách lẻ
              </h3>
              <button type="button" onClick={() => toast.info("Sẽ hỗ trợ thêm khách hàng sau.")}>+ Thêm</button>
            </div>

            <div className="pos-v2-summary-grid">
              <div>
                <span>Tạm tính ({totalItems} sp)</span>
                <strong>{formatVndFromDecimal(subtotal)}</strong>
              </div>
              <div>
                <span>Chiết khấu</span>
                <strong>{formatVndFromDecimal(headerDiscount)}</strong>
              </div>
              <div>
                <span>Thuế (VAT 8%)</span>
                <strong>{formatVndFromDecimal(vatAmount)}</strong>
              </div>
            </div>

            <div className="pos-v2-payable-row">
              <span>Khách cần trả</span>
              <strong>{formatVndFromDecimal(total)}</strong>
            </div>

            <div className="pos-v2-method-row">
              {PAYMENT_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`pos-v2-method-btn ${paymentMethod === item.value ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod(item.value)}
                >
                  {paymentMethodIcon(item.value)}
                  {item.label}
                </button>
              ))}
            </div>

            <label className="pos-v2-cash-input-wrap">
              Khách đưa
              <input
                type="text"
                inputMode="numeric"
                value={formatCashInput(cashReceived)}
                disabled={paymentMethod !== "CASH" || checkoutM.isPending}
                onChange={(e) => setCashReceived(parseCashInput(e.target.value))}
              />
            </label>

            <div className="pos-v2-change-row">
              <span>Tiền thừa trả khách</span>
              <strong>{formatVndFromDecimal(changeAmount)}</strong>
            </div>

            <div className="pos-v2-quick-cash-row">
              {QUICK_CASH_VALUES.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashReceived((prev) => prev + amount)}
                  disabled={paymentMethod !== "CASH" || checkoutM.isPending}
                >
                  +{formatVndFromDecimal(amount)}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pos-v2-complete-btn"
              disabled={lines.length === 0 || checkoutM.isPending || !scopeReady}
              onClick={() => checkoutM.mutate()}
            >
              {checkoutM.isPending ? "ĐANG XỬ LÝ..." : "HOÀN TẤT THANH TOÁN"}
            </button>

            {machine.status === "error" && machine.message ? (
              <p className="pos-v2-error-text" role="alert">
                {machine.message}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {showCatalogModal && (
        <div className="pos-v2-modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="pos-v2-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="pos-v2-modal-header">
              <h2>Chọn sản phẩm</h2>
              <button
                type="button"
                className="pos-v2-modal-close"
                onClick={() => setShowCatalogModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="pos-v2-modal-content">
              <input
                type="text"
                className="pos-v2-catalog-search"
                value={catalogKeyword}
                placeholder="Lọc sản phẩm theo tên hoặc SKU..."
                onChange={(e) => setCatalogKeyword(e.target.value)}
              />

              <div className="pos-v2-catalog-grid" role="list">
                {productsQ.isPending ? (
                  <div className="pos-v2-empty-state">Đang tải danh mục sản phẩm...</div>
                ) : productsQ.isError ? (
                  <div className="pos-v2-empty-state">{formatApiError(productsQ.error)}</div>
                ) : catalogVariants.length === 0 ? (
                  <div className="pos-v2-empty-state">Không tìm thấy sản phẩm phù hợp bộ lọc hiện tại.</div>
                ) : (
                  catalogVariants.map((variant) => {
                    const imageUrl = imageBlobByVariantId.get(variant.variantId);
                    const availableQty = stockByVariantQ.data?.get(variant.variantId);
                    const isOutOfStock = typeof availableQty === "number" && availableQty <= 0;
                    return (
                      <button
                        key={variant.variantId}
                        type="button"
                        role="listitem"
                        className={`pos-v2-product-card ${isOutOfStock ? "is-out" : ""}`}
                        disabled={isOutOfStock}
                        onClick={() => {
                          addVariant(variant);
                          setShowCatalogModal(false);
                        }}
                      >
                        <span className="pos-v2-stock-badge">
                          {typeof availableQty === "number" ? `SL: ${availableQty}` : "SL: --"}
                        </span>

                        <div className="pos-v2-product-thumb">
                          {imageUrl ? (
                            <img src={imageUrl} alt={displayVariantName(toPosCartLine(variant))} loading="lazy" />
                          ) : (
                            <span>{variant.sku.slice(0, 3).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="pos-v2-product-meta">
                          <p className="pos-v2-product-name">{variant.productName}</p>
                          <p className="pos-v2-product-sku">{variant.sku}</p>
                          <p className="pos-v2-product-sku" style={{ color: '#6b7280', fontSize: '0.72rem' }}>{variant.variantName}</p>
                          <p className="pos-v2-product-price">{formatVndFromDecimal(variant.sellingPrice)}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
