import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PosTerminalPage } from "@/features/pos/pos-terminal-page";

const mockCreateDraft = vi.fn();
const mockConfirmOrder = vi.fn();
const mockFetchPosVariantByBarcode = vi.fn();
const mockFetchPosVariantSearch = vi.fn();
const mockFetchProductsPage = vi.fn();
const mockFetchProductImageBlobUrl = vi.fn();
const mockFetchInventoryAvailability = vi.fn();
const mockFetchCategoriesPage = vi.fn();

vi.mock("@/api/sales-orders-api", () => ({
  createSalesOrderDraft: (...args: unknown[]) => mockCreateDraft(...args),
  confirmSalesOrder: (...args: unknown[]) => mockConfirmOrder(...args),
}));

vi.mock("@/api/branches-api", () => ({
  fetchBranchesForStore: vi.fn().mockResolvedValue({
    content: [
      {
        branchId: 11,
        branchName: "Kho tổng",
      },
    ],
  }),
}));

vi.mock("@/api/categories-api", () => ({
  fetchCategoriesPage: (...args: unknown[]) => mockFetchCategoriesPage(...args),
}));

vi.mock("@/api/products-api", () => ({
  fetchPosVariantByBarcode: (...args: unknown[]) => mockFetchPosVariantByBarcode(...args),
  fetchPosVariantSearch: (...args: unknown[]) => mockFetchPosVariantSearch(...args),
  fetchProductsPage: (...args: unknown[]) => mockFetchProductsPage(...args),
  fetchProductImageBlobUrl: (...args: unknown[]) => mockFetchProductImageBlobUrl(...args),
}));

vi.mock("@/api/inventory-api", () => ({
  fetchInventoryAvailability: (...args: unknown[]) => mockFetchInventoryAvailability(...args),
}));

vi.mock("@/features/auth/access", () => ({
  isStoreManagerRole: () => false,
  isSystemManage: () => false,
  isFrontlineCashierNav: () => true,
}));

vi.mock("@/hooks/use-store-name-map", () => ({
  useStoreNameMap: () => ({
    stores: [{ id: 1, storeName: "Circlek" }],
    getStoreName: (id: number | null | undefined) => {
      if (id === 1) return "Circlek";
      return "—";
    },
  }),
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

describe("PosTerminalPage", () => {
  beforeEach(() => {
    mockCreateDraft.mockReset();
    mockConfirmOrder.mockReset();
    mockFetchPosVariantByBarcode.mockReset();
    mockFetchPosVariantSearch.mockReset();
    mockFetchProductsPage.mockReset();
    mockFetchProductImageBlobUrl.mockReset();
    mockFetchInventoryAvailability.mockReset();
    mockFetchCategoriesPage.mockReset();

    mockFetchProductsPage.mockResolvedValue({ content: [] });
    mockFetchCategoriesPage.mockResolvedValue({ content: [] });
    mockFetchPosVariantSearch.mockResolvedValue([]);
    mockFetchProductImageBlobUrl.mockResolvedValue("blob:http://localhost/product-image");

    mockFetchInventoryAvailability.mockImplementation(async (_storeId: number, variantId: number) => ({
      variantId,
      storeId: 1,
      variantSku: `SKU-${variantId}`,
      variantName: "Lon",
      locations: [
        {
          warehouseId: 10,
          warehouseName: "Kho tổng",
          warehouseType: "BRANCH",
          branchId: 11,
          branchName: "Kho tổng",
          quantityOnHand: "50",
        },
      ],
    }));
  });

  it("adds SKU from lookup and completes checkout", async () => {
    mockCreateDraft.mockResolvedValue({ id: 5001 });
    mockConfirmOrder.mockResolvedValue({ id: 5001, orderCode: "SO5001", items: [] });
    mockFetchPosVariantByBarcode.mockResolvedValue({
      variantId: 101,
      sku: "SKU-101",
      productName: "Cola",
      variantName: "Lon",
      sellingPrice: "12000",
    });

    const user = userEvent.setup();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <PosTerminalPage />
      </QueryClientProvider>,
    );

    const input = await screen.findByPlaceholderText(/Quét mã vạch hoặc nhập mã SKU.../i);
    await waitFor(() => {
      expect(input).toBeEnabled();
    });

    await user.type(input, "SKU-101{enter}");

    await waitFor(() => {
      expect(screen.getByText(/SKU: SKU-101/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /HOÀN TẤT THANH TOÁN/i }));

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
            paymentMethod: "CASH",
            amount: 12000,
          }),
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/đã thanh toán thành công/i)).toBeInTheDocument();
    });
  });
});
