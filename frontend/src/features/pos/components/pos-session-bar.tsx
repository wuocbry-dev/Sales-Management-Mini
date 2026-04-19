import type { ProductVariantOptionResponse } from "@/types/product";
import { BarcodeScannerInput } from "@/components/catalog/barcode-scanner-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BranchOption = {
  branchId: number;
  branchName: string;
};

type StoreOption = {
  id: number;
  storeName: string;
};

type PosSessionBarProps = {
  cashierName: string;
  storeId: number;
  branchId: number | null;
  stores: StoreOption[];
  branches: BranchOption[];
  canPickStore: boolean;
  canPickBranch: boolean;
  onStoreChange: (id: number) => void;
  onBranchChange: (id: number | null) => void;
  onScanned: (row: ProductVariantOptionResponse) => void;
};

export function PosSessionBar({
  cashierName,
  storeId,
  branchId,
  stores,
  branches,
  canPickStore,
  canPickBranch,
  onStoreChange,
  onBranchChange,
  onScanned,
}: PosSessionBarProps) {
  const selectedStore = stores.find((s) => s.id === storeId);
  const selectedBranch = branchId != null ? branches.find((b) => b.branchId === branchId) : null;

  const storeBadgeLabel = selectedStore?.storeName ?? (storeId > 0 ? `#${storeId}` : "-");
  const branchBadgeLabel =
    selectedBranch?.branchName ?? (branchId == null ? "Kho tổng" : `#${branchId}`);

  return (
    <Card className="pos-panel">
      <CardHeader className="pb-1">
        <CardTitle className="text-base md:text-lg">Quầy POS - Bán hàng nhanh</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,2.45fr)_minmax(280px,1fr)]">
        <div className="space-y-2">
          <BarcodeScannerInput storeId={storeId} disabled={storeId <= 0} onFound={onScanned} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">Thu ngân: {cashierName}</Badge>
            <Badge variant="outline">Cửa hàng: {storeBadgeLabel}</Badge>
            <Badge variant="outline">Chi nhánh: {branchBadgeLabel}</Badge>
          </div>
        </div>

        <div className="grid content-start self-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block text-xs font-semibold text-muted-foreground">
            Cửa hàng
            <select
              className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
              value={storeId > 0 ? String(storeId) : ""}
              disabled={!canPickStore}
              onChange={(e) => onStoreChange(Number(e.target.value) || 0)}
            >
              <option value="">Chọn cửa hàng</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-muted-foreground">
            Chi nhánh
            <select
              className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
              value={branchId != null ? String(branchId) : ""}
              disabled={!canPickBranch}
              onChange={(e) => {
                const v = Number(e.target.value);
                onBranchChange(Number.isFinite(v) && v > 0 ? v : null);
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
        </div>
      </CardContent>
    </Card>
  );
}
