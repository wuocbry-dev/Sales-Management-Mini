import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PosTerminalPage } from "@/features/pos/pos-terminal-page";

vi.mock("@/api/branches-api", () => ({
  fetchBranchesForStore: vi.fn().mockResolvedValue({
    content: [
      {
        branchId: 11,
        branchName: "Chi nhánh 1",
      },
    ],
  }),
}));

vi.mock("@/features/auth/access", () => ({
  isStoreManagerRole: () => true,
  isSystemManage: () => false,
  isFrontlineCashierNav: () => false,
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
        fullName: "Manager A",
        username: "manager",
        defaultStoreId: 1,
        storeIds: [1],
        branchIds: [],
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
    vi.clearAllMocks();
  });

  it("renders store and branch selection", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <PosTerminalPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Bán hàng POS/i)).toBeInTheDocument();
      expect(screen.getByText(/Cửa hàng/i)).toBeInTheDocument();
      expect(screen.getByText(/Chi nhánh/i)).toBeInTheDocument();
    });
  });
});

