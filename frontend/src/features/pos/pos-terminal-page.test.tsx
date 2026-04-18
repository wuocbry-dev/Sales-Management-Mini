import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductVariantOptionResponse } from "@/types/product";
import { PosTerminalPage } from "@/features/pos/pos-terminal-page";

const mockCreateDraft = vi.fn();
const mockConfirmOrder = vi.fn();

vi.mock("@/api/sales-orders-api", () => ({
  createSalesOrderDraft: (...args: unknown[]) => mockCreateDraft(...args),
  confirmSalesOrder: (...args: unknown[]) => mockConfirmOrder(...args),
}));

vi.mock("@/api/branches-api", () => ({
  fetchBranchesForStore: vi.fn().mockResolvedValue({ content: [] }),
}));

vi.mock("@/features/auth/access", () => ({
  isStoreManagerRole: () => false,
  isSystemManage: () => false,
  isFrontlineCashierNav: () => true,
}));

vi.mock("@/hooks/use-store-name-map", () => ({
  useStoreNameMap: () => ({ stores: [] }),
}));

vi.mock("@/features/auth/auth-store", () => ({
  useAuthStore: (selector: (state: { me: unknown }) => unknown) =>
    selector({
      me: {
        fullName: "Cashier A",
        username: "cashier",
        defaultStoreId: 1,
        storeIds: [1],
        branchIds: [11],
      },
    }),
}));

vi.mock("@/features/pos/pos-scope-store", () => {
  const state = {
    selectedStoreId: null as number | null,
    selectedBranchId: null as number | null,
  };
  return {
    usePosScopeStore: (selector: (s: {
      selectedStoreId: number | null;
      selectedBranchId: number | null;
      setSelectedStoreId: (id: number | null) => void;
      setSelectedBranchId: (id: number | null) => void;
    }) => unknown) =>
      selector({
        ...state,
        setSelectedStoreId: (id: number | null) => {
          state.selectedStoreId = id;
        },
        setSelectedBranchId: (id: number | null) => {
          state.selectedBranchId = id;
        },
      }),
  };
});

vi.mock("@/features/pos/components/pos-session-bar", () => ({
  PosSessionBar: ({ onScanned }: { onScanned: (v: ProductVariantOptionResponse) => void }) => (
    <button
      type="button"
      onClick={() =>
        onScanned({
          variantId: 101,
          sku: "SKU-101",
          productName: "Cola",
          variantName: "Lon",
          sellingPrice: "12000",
        })
      }
    >
      scan-item
    </button>
  ),
}));

describe("PosTerminalPage happy flow", () => {
  beforeEach(() => {
    mockCreateDraft.mockReset();
    mockConfirmOrder.mockReset();
  });

  it("scans item, chooses payment method, completes checkout", async () => {
    mockCreateDraft.mockResolvedValue({ id: 5001 });
    mockConfirmOrder.mockResolvedValue({ id: 5001, orderCode: "SO5001" });

    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <PosTerminalPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "scan-item" }));
    await user.click(screen.getByRole("button", { name: "Card" }));
    await user.click(screen.getByRole("button", { name: "Complete checkout" }));

    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalledTimes(1);
      expect(mockConfirmOrder).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 1,
        branchId: 11,
        lines: [
          expect.objectContaining({
            variantId: 101,
            quantity: 1,
            unitPrice: 12000,
          }),
        ],
      }),
    );

    expect(mockConfirmOrder).toHaveBeenCalledWith(
      5001,
      expect.objectContaining({
        payments: [
          expect.objectContaining({
            paymentMethod: "CARD",
            amount: 12000,
          }),
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });
  });
});
