import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchStoresPage } from "@/api/stores-api";

/** Dùng chung để map `storeId` → `storeName` (một query danh sách cửa hàng). */
export const STORE_NAME_LOOKUP_QUERY_KEY = ["stores", "lookup-by-id"] as const;

type Options = {
  /** Mặc định `true`. */
  enabled?: boolean;
};

export function useStoreNameMap(options?: Options) {
  const enabled = options?.enabled !== false;

  const q = useQuery({
    queryKey: STORE_NAME_LOOKUP_QUERY_KEY,
    queryFn: () => fetchStoresPage({ page: 0, size: 500 }),
    enabled,
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  const byId = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of q.data?.content ?? []) {
      m.set(s.id, s.storeName);
    }
    return m;
  }, [q.data]);

  const getStoreName = useCallback(
    (id: number | null | undefined) => {
      if (id == null || !Number.isFinite(id) || id <= 0) return "—";
      return byId.get(id) ?? `Cửa hàng #${id}`;
    },
    [byId],
  );

  return {
    ...q,
    stores: q.data?.content ?? [],
    getStoreName,
  };
}
