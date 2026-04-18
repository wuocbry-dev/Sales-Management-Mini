import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type PosScopeState = {
  selectedStoreId: number | null;
  selectedBranchId: number | null;
  setSelectedStoreId: (storeId: number | null) => void;
  setSelectedBranchId: (branchId: number | null) => void;
  clear: () => void;
};

export const usePosScopeStore = create<PosScopeState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      selectedBranchId: null,
      setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
      clear: () =>
        set({
          selectedStoreId: null,
          selectedBranchId: null,
        }),
    }),
    {
      name: "bh-pos-scope",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        selectedStoreId: s.selectedStoreId,
        selectedBranchId: s.selectedBranchId,
      }),
    },
  ),
);
