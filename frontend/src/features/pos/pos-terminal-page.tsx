import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BrowserCodeReader, BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
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
import { fetchBranchById } from "@/api/branches-api";
import { fetchBranchesForStore } from "@/api/branches-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { createCustomer, fetchCustomersPage } from "@/api/customers-api";
import { fetchInventoryAvailability } from "@/api/inventory-api";
import {
  fetchPosVariantSearch,
  fetchProductImageBlobUrl,
  fetchProductsPage,
} from "@/api/products-api";
import { confirmSalesOrder, createSalesOrderDraft } from "@/api/sales-orders-api";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/auth-store";
import { hasPermission, isFrontlineCashierNav, isStoreManagerRole, isSystemManage } from "@/features/auth/access";
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
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { CustomerResponse } from "@/types/customer";
import type { InventoryAvailabilityResponse } from "@/types/inventory";
import type { ProductResponse, ProductVariantOptionResponse } from "@/types/product";
import type { SalesOrderResponse } from "@/types/sales-order";
import { canAccessRoute } from "@/app/route-access";

type PaymentMethod = "CASH" | "CARD" | "EWALLET";

type ScanLookupFeedback = {
  code: string;
  status: "success" | "error";
  message: string;
};

type ScanLookupResult =
  | {
      mode: "single";
      code: string;
      variant: ProductVariantOptionResponse;
    }
  | {
      mode: "multiple";
      code: string;
      variants: ProductVariantOptionResponse[];
    };

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

const DEFAULT_MARKET_VAT_RATE_PERCENT = 8;
const POS_MARKET_VAT_RATE_PERCENT = (() => {
  const raw = Number(import.meta.env.VITE_POS_MARKET_VAT_RATE_PERCENT ?? DEFAULT_MARKET_VAT_RATE_PERCENT);
  if (!Number.isFinite(raw)) return DEFAULT_MARKET_VAT_RATE_PERCENT;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
})();

const POS_PARKED_ORDERS_KEY = "pos-v2-parked-orders";
const POS_PARKED_ORDERS_LIMIT = 30;

type ParkedPosOrder = {
  id: string;
  storeId: number;
  branchId: number | null;
  customerId: number | null;
  customerName: string | null;
  customerPhoneLookup: string;
  forceGuestCustomer: boolean;
  headerDiscountAmount: number;
  vatRatePercent: number;
  lines: PosCartLine[];
  cashReceived: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "CASH" || value === "CARD" || value === "EWALLET";
}

function readParkedOrders(): ParkedPosOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POS_PARKED_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: ParkedPosOrder[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const record = item as Partial<ParkedPosOrder>;
      if (!Number.isFinite(record.storeId) || (record.storeId ?? 0) <= 0) continue;
      if (!Array.isArray(record.lines) || record.lines.length === 0) continue;
      if (!isPaymentMethod(record.paymentMethod)) continue;
      out.push({
        id: typeof record.id === "string" && record.id.length > 0 ? record.id : `${Date.now()}-${Math.random()}`,
        storeId: Number(record.storeId),
        branchId: Number.isFinite(record.branchId as number)
          ? Number(record.branchId)
          : record.branchId == null
            ? null
            : null,
        customerId: Number.isFinite(record.customerId as number) ? Number(record.customerId) : null,
        customerName: typeof record.customerName === "string" && record.customerName.trim().length > 0 ? record.customerName : null,
        customerPhoneLookup:
          typeof record.customerPhoneLookup === "string" ? record.customerPhoneLookup : "",
        forceGuestCustomer:
          typeof record.forceGuestCustomer === "boolean"
            ? record.forceGuestCustomer
            : !(Number.isFinite(record.customerId as number) && Number(record.customerId) > 0),
        headerDiscountAmount:
          Number.isFinite(record.headerDiscountAmount) && Number(record.headerDiscountAmount) >= 0
            ? Number(record.headerDiscountAmount)
            : 0,
        vatRatePercent:
          Number.isFinite(record.vatRatePercent) && Number(record.vatRatePercent) >= 0
            ? Math.min(100, Number(record.vatRatePercent))
            : POS_MARKET_VAT_RATE_PERCENT,
        lines: record.lines as PosCartLine[],
        cashReceived: Number.isFinite(record.cashReceived) ? Number(record.cashReceived) : 0,
        paymentMethod: record.paymentMethod,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeParkedOrders(orders: ParkedPosOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POS_PARKED_ORDERS_KEY, JSON.stringify(orders));
}

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

function formatPercentInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (Math.round(value) === value) return String(value);
  return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
}

function normalizeLookupCode(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

function buildNotInStoreScanMessage(code: string): string {
  if (!code) {
    return "Mã vạch không nằm trong cửa hàng hiện tại hoặc chưa được khai báo.";
  }
  return `Mã vạch ${code} không nằm trong cửa hàng hiện tại hoặc chưa được khai báo.`;
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function createPosCustomerCode(phoneDigits: string): string {
  const stamp = Date.now().toString().slice(-8);
  const tail = phoneDigits.slice(-6).padStart(6, "0");
  const rand = Math.floor(Math.random() * 90 + 10)
    .toString()
    .padStart(2, "0");
  return `KH${stamp}${tail}${rand}`;
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

function paymentMethodLabel(method: PaymentMethod): string {
  if (method === "CARD") return "Thẻ/Bank";
  if (method === "EWALLET") return "QR Pay";
  return "Tiền mặt";
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

function selectedBranchLabel(
  branchId: number | null,
  branches: Array<{ branchId: number; branchName: string }>,
  branchName?: string | null,
): string {
  if (branchId == null) return "Kho tổng";
  if (branchName) return branchName;
  const found = branches.find((b) => b.branchId === branchId);
  return found?.branchName ?? `Chi nhánh ${branchId}`;
}

function pickPreferredCameraDevice(devices: MediaDeviceInfo[]): MediaDeviceInfo | null {
  if (devices.length === 0) return null;
  const back = devices.find((d) => /back|rear|environment|sau/i.test(d.label));
  return back ?? devices[0];
}

export function PosTerminalPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.me);
  const selectedStoreId = usePosScopeStore((s) => s.selectedStoreId);
  const selectedBranchId = usePosScopeStore((s) => s.selectedBranchId);
  const setSelectedStoreId = usePosScopeStore((s) => s.setSelectedStoreId);
  const setSelectedBranchId = usePosScopeStore((s) => s.setSelectedBranchId);

  const manager = isManager(me);
  const isCashier = isFrontlineCashierNav(me);
  const canViewBranch = Boolean(me && (isSystemManage(me) || hasPermission(me, "BRANCH_VIEW")));
  const canViewCustomer = Boolean(me && (isSystemManage(me) || hasPermission(me, "CUSTOMER_VIEW")));
  const canCreateCustomer = Boolean(me && (isSystemManage(me) || hasPermission(me, "CUSTOMER_CREATE")));
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
  const [showParkedOrdersModal, setShowParkedOrdersModal] = useState(false);
  const [showCameraScanModal, setShowCameraScanModal] = useState(false);
  const [showScanCandidatesModal, setShowScanCandidatesModal] = useState(false);
  const [scanCandidates, setScanCandidates] = useState<ProductVariantOptionResponse[]>([]);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState("");
  const [cameraScanHint, setCameraScanHint] = useState("");
  const [cameraScanError, setCameraScanError] = useState<string | null>(null);
  const [parkedOrdersVersion, setParkedOrdersVersion] = useState(0);
  const [customerPhoneLookup, setCustomerPhoneLookup] = useState("");
  const [forceGuestCustomer, setForceGuestCustomer] = useState(true);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [headerDiscountAmount, setHeaderDiscountAmount] = useState(0);
  const [scanFeedback, setScanFeedback] = useState<ScanLookupFeedback | null>(null);
  const checkoutSummaryRef = useRef<{
    subtotal: number;
    discountAmount: number;
    vatRatePercent: number;
    vatAmount: number;
    total: number;
  } | null>(null);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const cameraControlsRef = useRef<IScannerControls | null>(null);
  const cameraLastDecodedRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const cameraStartingRef = useRef(false);
  const cameraActiveDeviceRef = useRef("");
  const scanLookupMutateRef = useRef<(code: string) => void>(() => {});
  const backTarget = canAccessRoute(me, "/app/don-ban")
    ? "/app/don-ban"
    : canAccessRoute(me, "/app/tong-quan")
      ? "/app/tong-quan"
      : "/app";

  const stopCameraScanner = useCallback(() => {
    cameraControlsRef.current?.stop();
    cameraControlsRef.current = null;
    cameraReaderRef.current = null;
    cameraActiveDeviceRef.current = "";

    const video = cameraVideoRef.current;
    if (video) {
      const stream = video.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      video.pause();
      video.srcObject = null;
    }
  }, []);

  const closeCameraScanModal = useCallback(() => {
    stopCameraScanner();
    setShowCameraScanModal(false);
    setCameraScanHint("");
    setCameraScanError(null);
  }, [stopCameraScanner]);

  const closeScanCandidatesModal = useCallback(() => {
    setShowScanCandidatesModal(false);
    setScanCandidates([]);
    scannerInputRef.current?.focus();
  }, []);

  const { getStoreName } = useStoreNameMap();

  const branchesQ = useQuery({
    queryKey: ["pos", "branches", storeId],
    queryFn: () => fetchBranchesForStore(storeId, { page: 0, size: 200 }),
    enabled: manager && canViewBranch && storeId > 0,
    staleTime: 60_000,
    retry: false,
  });

  const branchDetailQ = useQuery({
    queryKey: ["pos", "branch", branchId],
    queryFn: () => fetchBranchById(branchId!),
    // Frontline users are locked to assigned branch and still need readable branch name on POS header.
    enabled: branchId != null && branchId > 0 && (manager ? canViewBranch : true),
    staleTime: 60_000,
    retry: false,
  });

  const customersQ = useQuery({
    queryKey: ["pos", "customers", storeId],
    queryFn: () => fetchCustomersPage({ page: 0, size: 500, storeId }),
    enabled: canViewCustomer && storeId > 0,
    staleTime: 60_000,
    retry: false,
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

  const catalogBlobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    (catalogImagesQ.data ?? []).forEach((item) => catalogBlobUrlsRef.current.add(item.blobUrl));
  }, [catalogImagesQ.data]);

  useEffect(() => {
    return () => {
      catalogBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      catalogBlobUrlsRef.current.clear();
    };
  }, []);

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
  const selectedBranchName = selectedBranchLabel(branchId, branchesQ.data?.content ?? [], branchDetailQ.data?.branchName);
  const customers = customersQ.data?.content ?? [];
  const normalizedCustomerPhone = useMemo(() => normalizePhone(customerPhoneLookup), [customerPhoneLookup]);
  const matchedCustomer = useMemo(() => {
    if (!normalizedCustomerPhone) return null;
    return customers.find((c) => normalizePhone(c.phone) === normalizedCustomerPhone) ?? null;
  }, [customers, normalizedCustomerPhone]);
  const selectedCustomer: CustomerResponse | null = canViewCustomer && !forceGuestCustomer ? matchedCustomer : null;
  const customerHeadline = selectedCustomer?.fullName ?? "Khách lẻ";
  
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
  const safeHeaderDiscountAmount = useMemo(
    () => Math.max(0, Math.trunc(headerDiscountAmount || 0)),
    [headerDiscountAmount],
  );
  const safeVatRatePercent = POS_MARKET_VAT_RATE_PERCENT;
  const taxableAmount = useMemo(
    () => Math.max(0, subtotal - safeHeaderDiscountAmount),
    [subtotal, safeHeaderDiscountAmount],
  );
  const vatAmount = useMemo(
    () => Math.round(((taxableAmount * safeVatRatePercent) / 100) * 10_000) / 10_000,
    [taxableAmount, safeVatRatePercent],
  );
  const total = Math.max(0, taxableAmount + vatAmount);
  const changeAmount = paymentMethod === "CASH" ? Math.max(0, cashReceived - total) : 0;

  const parkedOrdersInScope = useMemo(() => {
    const toMillis = (s: string) => {
      const t = Date.parse(s);
      return Number.isFinite(t) ? t : 0;
    };
    return readParkedOrders()
      .filter((x) => x.storeId === storeId && x.branchId === branchId)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  }, [storeId, branchId, parkedOrdersVersion]);

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
    mutationFn: async (rawCode: string): Promise<ScanLookupResult> => {
      const code = normalizeLookupCode(rawCode);
      if (!code) {
        throw new Error("Vui lòng nhập mã SKU hoặc barcode.");
      }

      const matches = await fetchPosVariantSearch({ storeId, q: code });
      if (matches.length === 0) {
        throw new Error(buildNotInStoreScanMessage(code));
      }

      const loweredCode = code.toLowerCase();
      const exactSkuMatches = matches.filter((row) => row.sku.trim().toLowerCase() === loweredCode);
      if (exactSkuMatches.length === 1) {
        return {
          mode: "single",
          code,
          variant: exactSkuMatches[0],
        };
      }

      if (matches.length === 1) {
        return {
          mode: "single",
          code,
          variant: matches[0],
        };
      }

      return {
        mode: "multiple",
        code,
        variants: matches,
      };
    },
    onMutate: () => {
      setShowScanCandidatesModal(false);
      setScanCandidates([]);
    },
    onSuccess: (result) => {
      setScanCode(result.code);

      if (result.mode === "single") {
        addVariant(result.variant);
        setScanFeedback({
          code: result.code,
          status: "success",
          message: `Quét thành công - đã nhận mã cho SKU ${result.variant.sku}.`,
        });
        scannerInputRef.current?.focus();
        return;
      }

      setScanFeedback({
        code: result.code,
        status: "success",
        message: `Tìm thấy ${result.variants.length} sản phẩm liên quan. Vui lòng chọn SKU phù hợp.`,
      });
      setScanCandidates(result.variants);
      setShowScanCandidatesModal(true);
    },
    onError: (err, rawCode) => {
      const normalizedCode = normalizeLookupCode(rawCode);
      const fallback = formatApiError(err).trim();
      const message = fallback || buildNotInStoreScanMessage(normalizedCode);
      setScanCode(normalizedCode);
      setScanFeedback({ code: normalizedCode, status: "error", message });
      toast.error(message);
      scannerInputRef.current?.focus();
    },
  });
  scanLookupMutateRef.current = scanLookupM.mutate;

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

      const amount = total;
      if (paymentMethod === "CASH" && cashReceived < amount) {
        throw new Error("Số tiền khách đưa chưa đủ.");
      }
      receiptTenderedAmountRef.current = paymentMethod === "CASH" ? cashReceived : amount;
      checkoutSummaryRef.current = {
        subtotal,
        discountAmount: safeHeaderDiscountAmount,
        vatRatePercent: safeVatRatePercent,
        vatAmount,
        total: amount,
      };

      const draft = await createSalesOrderDraft(
        toDraftPayload({
          storeId,
          branchId,
          customerId: selectedCustomer?.id ?? null,
          lines,
          headerDiscountAmount: safeHeaderDiscountAmount,
          vatRatePercent: safeVatRatePercent,
          vatAmount,
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

  const createCustomerM = useMutation({
    mutationFn: async () => {
      if (!canCreateCustomer) {
        throw new Error("Tài khoản hiện tại không có quyền thêm khách hàng.");
      }
      if (!storeId || storeId <= 0) {
        throw new Error("Thiếu cửa hàng vận hành POS.");
      }

      const fullName = newCustomerName.trim();
      if (!fullName) {
        throw new Error("Vui lòng nhập tên khách hàng.");
      }

      const phoneDigits = normalizePhone(newCustomerPhone);
      if (phoneDigits.length < 8) {
        throw new Error("Số điện thoại không hợp lệ.");
      }

      const existed = customers.find((c) => normalizePhone(c.phone) === phoneDigits);
      if (existed) {
        return {
          created: existed,
          alreadyExists: true,
        } as const;
      }

      const created = await createCustomer({
        storeId,
        customerCode: createPosCustomerCode(phoneDigits),
        fullName,
        phone: phoneDigits,
        email: null,
        gender: null,
        dateOfBirth: null,
        address: null,
        status: "ACTIVE",
      });

      return {
        created,
        alreadyExists: false,
      } as const;
    },
    onSuccess: async ({ created, alreadyExists }) => {
      await qc.invalidateQueries({ queryKey: ["pos", "customers", storeId] });
      await qc.invalidateQueries({ queryKey: ["customers"] });

      setCustomerPhoneLookup(created.phone ?? "");
      setForceGuestCustomer(false);
      setShowCreateCustomerModal(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success(alreadyExists ? "Khách hàng đã tồn tại, đã gắn vào đơn hiện tại." : "Đã thêm khách hàng mới.");
    },
    onError: (err) => {
      toast.error(formatApiError(err));
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
    setShowScanCandidatesModal(false);
    setScanCandidates([]);
    setCatalogKeyword("");
    setCustomerPhoneLookup("");
    setForceGuestCustomer(true);
    setHeaderDiscountAmount(0);
    setCashReceived(0);
    setPaymentMethod("CASH");
    setCompletedOrder(null);
    checkoutSummaryRef.current = null;
    receiptTenderedAmountRef.current = null;
    checkoutM.reset();
    dispatch({ type: "IDLE" });
  };

  const holdCurrentOrder = () => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng/chi nhánh trước khi tạm giữ đơn.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Giỏ hàng đang trống.");
      return;
    }

    const current = readParkedOrders();
    const next: ParkedPosOrder[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        storeId,
        branchId,
        customerId: selectedCustomer?.id ?? null,
        customerName: selectedCustomer?.fullName ?? null,
        customerPhoneLookup,
        forceGuestCustomer,
        headerDiscountAmount: safeHeaderDiscountAmount,
        vatRatePercent: safeVatRatePercent,
        lines,
        cashReceived,
        paymentMethod,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, POS_PARKED_ORDERS_LIMIT);

    writeParkedOrders(next);
    setParkedOrdersVersion((prev) => prev + 1);
    const scopedCount = next.filter((x) => x.storeId === storeId && x.branchId === branchId).length;
    resetForNextSale();
    toast.success(`Đã tạm giữ đơn. Hiện có ${scopedCount} đơn tạm trong quầy này.`);
  };

  const openCreateCustomerModal = () => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng/chi nhánh trước khi thêm khách hàng.");
      return;
    }
    if (!canCreateCustomer) {
      toast.error("Tài khoản hiện tại không có quyền thêm khách hàng.");
      return;
    }
    setNewCustomerName("");
    setNewCustomerPhone(normalizedCustomerPhone || "");
    setShowCreateCustomerModal(true);
  };

  const openParkedOrdersModal = () => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng/chi nhánh trước khi mở đơn tạm.");
      return;
    }
    setParkedOrdersVersion((prev) => prev + 1);
    setShowParkedOrdersModal(true);
  };

  const restoreParkedOrderById = (parkedOrderId: string) => {
    const current = readParkedOrders();
    const idx = current.findIndex(
      (x) => x.id === parkedOrderId && x.storeId === storeId && x.branchId === branchId,
    );
    if (idx < 0) {
      setParkedOrdersVersion((prev) => prev + 1);
      toast.error("Đơn tạm không còn tồn tại.");
      return;
    }

    const [picked] = current.splice(idx, 1);
    writeParkedOrders(current);
    setParkedOrdersVersion((prev) => prev + 1);

    setLines(picked.lines);
    setScanCode("");
    setShowScanCandidatesModal(false);
    setScanCandidates([]);
    setCatalogKeyword("");
    setCustomerPhoneLookup(picked.customerPhoneLookup);
    setForceGuestCustomer(picked.forceGuestCustomer);
    setHeaderDiscountAmount(Math.max(0, Math.trunc(picked.headerDiscountAmount || 0)));
    setCashReceived(picked.cashReceived);
    setPaymentMethod(picked.paymentMethod);
    setCompletedOrder(null);
    checkoutSummaryRef.current = null;
    receiptTenderedAmountRef.current = null;
    checkoutM.reset();
    dispatch({ type: "IDLE" });
    setShowParkedOrdersModal(false);
    window.setTimeout(() => scannerInputRef.current?.focus(), 0);
    toast.success(`Đã mở đơn tạm (${picked.lines.length} sản phẩm).`);
  };

  const removeParkedOrderById = (parkedOrderId: string) => {
    const current = readParkedOrders();
    const next = current.filter((x) => x.id !== parkedOrderId);
    if (next.length === current.length) {
      toast.info("Đơn tạm đã được xử lý hoặc không còn tồn tại.");
      return;
    }
    writeParkedOrders(next);
    setParkedOrdersVersion((prev) => prev + 1);
    toast.success("Đã xóa đơn tạm khỏi lịch sử.");
  };

  const runLookup = () => {
    if (!scopeReady) {
      toast.error("Hoàn tất chọn cửa hàng/chi nhánh trước khi tìm SKU.");
      return;
    }
    const code = normalizeLookupCode(scanCode);
    if (!code) {
      toast.error("Vui lòng nhập SKU hoặc barcode để tìm.");
      return;
    }
    setShowScanCandidatesModal(false);
    setScanCandidates([]);
    setScanCode(code);
    scanLookupM.mutate(code);
  };

  useEffect(() => {
    if (!scanFeedback) {
      return;
    }

    const normalizedInputCode = normalizeLookupCode(scanCode);
    const normalizedFeedbackCode = normalizeLookupCode(scanFeedback.code);
    if (!normalizedInputCode || normalizedInputCode !== normalizedFeedbackCode) {
      setScanFeedback(null);
    }
  }, [scanCode, scanFeedback]);

  useEffect(() => {
    if (!showCameraScanModal) {
      stopCameraScanner();
      cameraStartingRef.current = false;
      return;
    }

    let cancelled = false;

    const startCameraScan = async () => {
      if (cameraStartingRef.current) {
        return;
      }
      cameraStartingRef.current = true;

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraScanError("Trình duyệt hiện tại không hỗ trợ camera scan trong ngữ cảnh này.");
        setCameraScanHint("");
        cameraStartingRef.current = false;
        return;
      }

      setCameraScanError(null);
      setCameraScanHint("Đang khởi tạo camera...");

      try {
        const devices = await BrowserCodeReader.listVideoInputDevices();
        if (cancelled) return;

        setCameraDevices(devices);

        const preferredDeviceId = selectedCameraDeviceId || pickPreferredCameraDevice(devices)?.deviceId || "";
        if (!preferredDeviceId) {
          setCameraScanHint("");
          setCameraScanError("Không tìm thấy camera khả dụng trên thiết bị này.");
          return;
        }

        if (!selectedCameraDeviceId) {
          setSelectedCameraDeviceId(preferredDeviceId);
          // Let the next effect cycle start scanner with stable selected device.
          return;
        }

        if (!cameraVideoRef.current) {
          setCameraScanHint("");
          setCameraScanError("Không khởi tạo được khung xem camera.");
          return;
        }

        if (cameraActiveDeviceRef.current === preferredDeviceId && cameraControlsRef.current) {
          setCameraScanHint("Đưa mã vạch vào khung hình để tự động quét.");
          return;
        }

        stopCameraScanner();

        const reader = new BrowserMultiFormatReader();
        cameraReaderRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(
          preferredDeviceId,
          cameraVideoRef.current,
          (result) => {
            if (!result) {
              return;
            }

            const code = result.getText()?.trim() ?? "";
            if (!code) {
              return;
            }

            const now = Date.now();
            if (cameraLastDecodedRef.current.code === code && now - cameraLastDecodedRef.current.at < 800) {
              return;
            }
            cameraLastDecodedRef.current = { code, at: now };

            stopCameraScanner();
            setShowCameraScanModal(false);
            setCameraScanHint("");
            setCameraScanError(null);

            setScanCode(code);
            scanLookupMutateRef.current(code);
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        cameraControlsRef.current = controls;
        cameraActiveDeviceRef.current = preferredDeviceId;
        setCameraScanHint("Đưa mã vạch vào khung hình để tự động quét.");
      } catch (error) {
        if (cancelled) return;
        setCameraScanHint("");
        const detail = error instanceof Error && error.message ? ` (${error.message})` : "";
        setCameraScanError(`Không mở được camera. Hãy kiểm tra quyền camera và thử lại.${detail}`);
      } finally {
        cameraStartingRef.current = false;
      }
    };

    void startCameraScan();

    return () => {
      cancelled = true;
      stopCameraScanner();
      cameraStartingRef.current = false;
    };
  }, [selectedCameraDeviceId, showCameraScanModal, stopCameraScanner]);

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
          <p style="margin:2px 0 8px 0;"><strong>Thời gian:</strong> ${formatDateTimeVi(new Date().toISOString())}</p>
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
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Chiết khấu:</span><strong>${formatVndFromDecimal(safeHeaderDiscountAmount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Thuế VAT (${safeVatRatePercent}%):</span><strong>${formatVndFromDecimal(vatAmount)}</strong></p>
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
    const checkoutSummary = checkoutSummaryRef.current;
    const orderSubtotal = checkoutSummary?.subtotal ?? toNumber(order.subtotal);
    const orderDiscount = checkoutSummary?.discountAmount ?? toNumber(order.discountAmount);
    const taxable = Math.max(0, orderSubtotal - orderDiscount);
    const totalAmount = checkoutSummary?.total ?? toNumber(order.totalAmount);
    const fallbackVatAmount = Math.max(0, totalAmount - taxable);
    const orderVatAmount = checkoutSummary?.vatAmount ?? fallbackVatAmount;
    const inferredVatRatePercent = taxable > 0 ? Math.round((orderVatAmount / taxable) * 10_000) / 100 : 0;
    const orderVatRatePercent = checkoutSummary?.vatRatePercent ?? inferredVatRatePercent;
    const vatRateLabel = formatPercentInput(orderVatRatePercent);
    const orderPaid = toNumber(order.paidAmount);
    const hasCashPayment = order.payments.some((payment) => payment.paymentMethod?.trim().toUpperCase() === "CASH");
    const paid =
      hasCashPayment && receiptTenderedAmountRef.current != null
        ? Math.max(orderPaid, receiptTenderedAmountRef.current)
        : orderPaid;
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
          <p style="margin:2px 0 8px 0;"><strong>Ngày:</strong> ${formatDateTimeVi(order.orderDate)}</p>
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
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tạm tính:</span><strong>${formatVndFromDecimal(orderSubtotal)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Giảm giá:</span><strong>${formatVndFromDecimal(orderDiscount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Thuế VAT (${vatRateLabel}%):</span><strong>${formatVndFromDecimal(orderVatAmount)}</strong></p>
            <p style="display:flex;justify-content:space-between;margin:3px 0;"><span>Tổng tiền:</span><strong>${formatVndFromDecimal(totalAmount)}</strong></p>
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

  return (
    <div className="pos-v2-shell">
      <div className="pos-v2-topbar">
        <div className="pos-v2-topbar-row-1">
          <button
            type="button"
            onClick={() => navigate(backTarget, { replace: true })}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
            title="Quay lại giao diện nhân viên"
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
              onChange={(e) => {
                setScanCode(e.target.value);
                setShowScanCandidatesModal(false);
                setScanCandidates([]);
              }}
              onFocus={(e) => e.currentTarget.select()}
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
            <button
              type="button"
              className="pos-v2-icon-btn"
              aria-label="Camera scan"
              title="Quét mã bằng camera"
              disabled={!scopeReady || scanLookupM.isPending}
              onClick={() => {
                setCameraScanError(null);
                setCameraScanHint("");
                setShowCameraScanModal(true);
              }}
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="pos-v2-user-box">
            <div className="pos-v2-user-meta">
              <p className="pos-v2-user-name">{me?.fullName ?? me?.username ?? "Người dùng"}</p>
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

        {scanFeedback ? (
          <div
            className={
              scanFeedback.status === "success"
                ? "mx-1 mt-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                : "mx-1 mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
            }
          >
            Mã vừa quét: <span className="font-semibold">{scanFeedback.code || "(trống)"}</span> - {scanFeedback.message}
          </div>
        ) : null}
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
            <button
              type="button"
              className="pos-v2-panel-search-btn"
              onClick={() => setShowCatalogModal(true)}
              disabled={!scopeReady}
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              Tìm kiếm sản phẩm
            </button>
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
                      <AppImage
                        src={imageUrl}
                        alt={displayVariantName(line)}
                        withFrame={false}
                        containerClassName="h-full w-full"
                        imageClassName="h-full w-full object-contain p-0"
                        fallback={<span>{line.sku.slice(0, 2).toUpperCase()}</span>}
                      />
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
              onClick={holdCurrentOrder}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Tạm giữ
            </button>
            <button
              type="button"
              className="pos-v2-footer-btn"
              onClick={openParkedOrdersModal}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Mở đơn tạm
            </button>
            <button
              type="button"
              className="pos-v2-footer-btn pos-v2-footer-btn-danger"
              onClick={() => {
                resetForNextSale();
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
          <div className="pos-v2-payment-panel">
            <section className="pos-v2-payment-section pos-v2-payment-section-customer">
              <div className="pos-v2-payment-head">
                <h3>
                  <User className="h-4 w-4" aria-hidden />
                  {customerHeadline}
                </h3>
                <div className="pos-v2-payment-head-actions">
                  {canCreateCustomer ? (
                    <button type="button" onClick={openCreateCustomerModal}>
                      + Thêm khách
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerPhoneLookup("");
                      setForceGuestCustomer(true);
                    }}
                    disabled={forceGuestCustomer}
                  >
                    Khách lẻ
                  </button>
                </div>
              </div>

              <div className="pos-v2-payment-fields">
                <label className="pos-v2-customer-lookup-wrap">
                  <span>Số điện thoại khách</span>
                  <input
                    type="text"
                    inputMode="tel"
                    value={customerPhoneLookup}
                    placeholder="Nhập số điện thoại để tìm khách hàng"
                    disabled={checkoutM.isPending || !canViewCustomer}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCustomerPhoneLookup(next);
                      setForceGuestCustomer(next.trim().length === 0);
                    }}
                  />
                </label>

                <label className="pos-v2-customer-lookup-wrap">
                  <span>Chiết khấu đơn hàng</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCashInput(headerDiscountAmount)}
                    placeholder="Nhập số tiền giảm giá"
                    disabled={checkoutM.isPending}
                    onChange={(e) => setHeaderDiscountAmount(parseCashInput(e.target.value))}
                  />
                </label>
              </div>
            </section>

            <section className="pos-v2-payment-section pos-v2-payment-section-summary">
              <div className="pos-v2-summary-grid">
                <div>
                  <span>Tạm tính ({totalItems} sp)</span>
                  <strong>{formatVndFromDecimal(subtotal)}</strong>
                </div>
                <div>
                  <span>Chiết khấu</span>
                  <strong>{formatVndFromDecimal(safeHeaderDiscountAmount)}</strong>
                </div>
                <div>
                  <span>Thuế (VAT {safeVatRatePercent}%)</span>
                  <strong>{formatVndFromDecimal(vatAmount)}</strong>
                </div>
              </div>

              <div className="pos-v2-payable-row">
                <span>Khách cần trả</span>
                <strong>{formatVndFromDecimal(total)}</strong>
              </div>
            </section>

            <section className="pos-v2-payment-section pos-v2-payment-section-collect">
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
                <span>Khách đưa</span>
                <span className="pos-v2-cash-input-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCashInput(cashReceived)}
                    placeholder="Nhập số tiền khách đưa"
                    disabled={paymentMethod !== "CASH" || checkoutM.isPending}
                    onChange={(e) => setCashReceived(parseCashInput(e.target.value))}
                  />
                  <button
                    type="button"
                    className="pos-v2-cash-fill-btn"
                    onClick={() => setCashReceived(Math.ceil(total))}
                    disabled={paymentMethod !== "CASH" || checkoutM.isPending || total <= 0}
                  >
                    Đủ tiền
                  </button>
                </span>
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
            </section>

            {machine.status === "error" && machine.message ? (
              <p className="pos-v2-error-text" role="alert">
                {machine.message}
              </p>
            ) : null}

            <div className="pos-v2-payment-submit-row">
              <button
                type="button"
                className="pos-v2-complete-btn"
                disabled={lines.length === 0 || checkoutM.isPending || !scopeReady}
                onClick={() => checkoutM.mutate()}
              >
                {checkoutM.isPending ? "ĐANG XỬ LÝ..." : "HOÀN TẤT THANH TOÁN"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {showParkedOrdersModal && (
        <div className="pos-v2-modal-overlay" onClick={() => setShowParkedOrdersModal(false)}>
          <div className="pos-v2-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="pos-v2-modal-header">
              <h2>Lịch sử đơn tạm</h2>
              <button
                type="button"
                className="pos-v2-modal-close"
                onClick={() => setShowParkedOrdersModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="pos-v2-modal-content">
              <p className="text-sm font-medium text-slate-600">
                {selectedStoreName} · {selectedBranchName}
              </p>

              {parkedOrdersInScope.length === 0 ? (
                <div className="pos-v2-empty-state">Chưa có đơn tạm nào trong quầy này.</div>
              ) : (
                <div className="grid gap-3 overflow-y-auto">
                  {parkedOrdersInScope.map((order, idx) => {
                    const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);
                    const parkedSubtotal = order.lines.reduce((sum, line) => sum + lineTotal(line), 0);
                    const parkedDiscount = Math.max(0, Math.trunc(order.headerDiscountAmount || 0));
                    const parkedVatRate = Math.min(100, Math.max(0, Number(order.vatRatePercent) || 0));
                    const parkedTaxable = Math.max(0, parkedSubtotal - parkedDiscount);
                    const parkedVatAmount = Math.round(((parkedTaxable * parkedVatRate) / 100) * 10_000) / 10_000;
                    const parkedTotal = parkedTaxable + parkedVatAmount;
                    const firstLabel = order.lines[0] ? displayVariantName(order.lines[0]) : "Không có sản phẩm";

                    return (
                      <article key={order.id} className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">Đơn tạm #{parkedOrdersInScope.length - idx}</p>
                          <p className="text-xs font-medium text-slate-500">{formatDateTimeVi(order.createdAt)}</p>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">{firstLabel}</p>

                        <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-4">
                          <p>Sản phẩm: <strong>{itemCount}</strong></p>
                          <p>Khách: <strong>{order.forceGuestCustomer ? "Khách lẻ" : (order.customerName ?? "Khách hàng")}</strong></p>
                          <p>Thanh toán: <strong>{paymentMethodLabel(order.paymentMethod)}</strong></p>
                          <p>Tổng cần trả: <strong>{formatVndFromDecimal(parkedTotal)}</strong></p>
                        </div>

                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => removeParkedOrderById(order.id)}>
                            Xóa
                          </Button>
                          <Button type="button" size="sm" onClick={() => restoreParkedOrderById(order.id)}>
                            Mở đơn
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateCustomerModal && (
        <div className="pos-v2-modal-overlay" onClick={() => setShowCreateCustomerModal(false)}>
          <div className="pos-v2-modal-dialog pos-v2-modal-dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pos-v2-modal-header">
              <h2>Thêm khách hàng</h2>
              <button
                type="button"
                className="pos-v2-modal-close"
                onClick={() => setShowCreateCustomerModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="pos-v2-modal-content">
              <label className="pos-v2-customer-lookup-wrap">
                <span>Tên khách hàng</span>
                <input
                  type="text"
                  value={newCustomerName}
                  placeholder="Nhập tên khách hàng"
                  disabled={createCustomerM.isPending}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </label>

              <label className="pos-v2-customer-lookup-wrap">
                <span>Số điện thoại</span>
                <input
                  type="text"
                  inputMode="tel"
                  value={newCustomerPhone}
                  placeholder="Nhập số điện thoại"
                  disabled={createCustomerM.isPending}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </label>

              <div className="pos-v2-create-customer-actions">
                <Button type="button" variant="outline" onClick={() => setShowCreateCustomerModal(false)} disabled={createCustomerM.isPending}>
                  Hủy
                </Button>
                <Button type="button" onClick={() => createCustomerM.mutate()} disabled={createCustomerM.isPending}>
                  {createCustomerM.isPending ? "Đang lưu..." : "Lưu khách"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                          <AppImage
                            src={imageUrl}
                            alt={displayVariantName(toPosCartLine(variant))}
                            withFrame={false}
                            containerClassName="h-full w-full"
                            imageClassName="h-full w-full object-contain p-0"
                            fallback={<span>{variant.sku.slice(0, 3).toUpperCase()}</span>}
                          />
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

      {showScanCandidatesModal && (
        <div className="pos-v2-modal-overlay" onClick={closeScanCandidatesModal}>
          <div className="pos-v2-modal-dialog pos-v2-modal-dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pos-v2-modal-header">
              <h2>Chọn SKU phù hợp</h2>
              <button
                type="button"
                className="pos-v2-modal-close"
                onClick={closeScanCandidatesModal}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="pos-v2-modal-content">
              <p className="text-sm font-medium text-slate-600">
                Có {scanCandidates.length} kết quả liên quan đến mã <strong>{scanCode}</strong>.
              </p>

              <div className="grid max-h-[52vh] gap-2 overflow-y-auto">
                {scanCandidates.map((variant) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    className="rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => {
                      addVariant(variant);
                      setScanFeedback({
                        code: normalizeLookupCode(scanCode),
                        status: "success",
                        message: `Đã chọn SKU ${variant.sku} từ danh sách kết quả.`,
                      });
                      closeScanCandidatesModal();
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-900">{variant.productName}</p>
                    <p className="text-xs font-medium text-slate-500">SKU: {variant.sku}</p>
                    {variant.variantName ? (
                      <p className="text-xs font-medium text-slate-500">{variant.variantName}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-bold text-blue-700">{formatVndFromDecimal(variant.sellingPrice)}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={closeScanCandidatesModal}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCameraScanModal && (
        <div className="pos-v2-modal-overlay" onClick={closeCameraScanModal}>
          <div className="pos-v2-modal-dialog pos-v2-modal-dialog-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pos-v2-modal-header">
              <h2>Quét mã vạch bằng camera</h2>
              <button
                type="button"
                className="pos-v2-modal-close"
                onClick={closeCameraScanModal}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="pos-v2-modal-content space-y-3">
              {cameraDevices.length > 1 ? (
                <label className="pos-v2-customer-lookup-wrap">
                  <span>Chọn camera</span>
                  <select
                    value={selectedCameraDeviceId}
                    onChange={(e) => setSelectedCameraDeviceId(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="overflow-hidden rounded-md border border-slate-200 bg-black">
                <video ref={cameraVideoRef} className="h-64 w-full object-cover" autoPlay muted playsInline />
              </div>

              {cameraScanHint ? <p className="text-xs font-medium text-slate-600">{cameraScanHint}</p> : null}
              {cameraScanError ? <p className="text-sm font-semibold text-red-600">{cameraScanError}</p> : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCameraDevices([]);
                    setSelectedCameraDeviceId("");
                    setCameraScanHint("");
                    setCameraScanError(null);
                  }}
                >
                  Tải lại camera
                </Button>
                <Button type="button" onClick={closeCameraScanModal}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
