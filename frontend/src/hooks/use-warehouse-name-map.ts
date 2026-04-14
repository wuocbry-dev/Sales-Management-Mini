import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchStoresPage } from "@/api/stores-api";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { STORE_NAME_LOOKUP_QUERY_KEY } from "@/hooks/use-store-name-map";

export type WarehouseOption = {
  warehouseId: number;
  label: string;
};

type Options = {
  enabled?: boolean;
  /**
   * If provided (including an empty array), this exact list is used and no store lookup is performed.
   */
  storeIds?: number[];
  /**
   * Fallback list used only when `storeIds` is not provided and store lookup has no data.
   */
  fallbackStoreIds?: number[];
  /**
   * Prefix warehouse label with store name when multiple stores are involved.
   */
  includeStorePrefix?: boolean;
};

export const WAREHOUSE_NAME_LOOKUP_QUERY_KEY = ["warehouses", "lookup-by-id"] as const;

function normalizeIds(ids: number[] | undefined): number[] {
  if (!ids || ids.length === 0) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of ids) {
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function formatWarehouseLabel(
  warehouseName: string,
  warehouseCode: string,
  storeId: number,
  storeNameById: Map<number, string>,
  includeStorePrefix: boolean,
  totalStores: number,
): string {
  const prefix = includeStorePrefix && totalStores > 1 ? `${storeNameById.get(storeId) ?? `CH ${storeId}`} - ` : "";
  return `${prefix}${warehouseName} (${warehouseCode})`;
}

export function useWarehouseNameMap(options?: Options) {
  const enabled = options?.enabled !== false;
  const includeStorePrefix = options?.includeStorePrefix !== false;

  const hasExplicitStoreIds = Array.isArray(options?.storeIds);
  const explicitStoreIds = normalizeIds(options?.storeIds);

  const storesQ = useQuery({
    queryKey: STORE_NAME_LOOKUP_QUERY_KEY,
    queryFn: () => fetchStoresPage({ page: 0, size: 500 }),
    enabled: enabled && !hasExplicitStoreIds,
    staleTime: 60_000,
    retry: false,
  });

  const fallbackStoreIds = normalizeIds(options?.fallbackStoreIds);

  const resolvedStoreIds = useMemo(() => {
    if (hasExplicitStoreIds) return explicitStoreIds;
    const fromLookup = normalizeIds((storesQ.data?.content ?? []).map((s) => s.id));
    if (fromLookup.length > 0) return fromLookup;
    return fallbackStoreIds;
  }, [hasExplicitStoreIds, explicitStoreIds, storesQ.data, fallbackStoreIds]);

  const whQueries = useQueries({
    queries: resolvedStoreIds.map((storeId) => ({
      queryKey: [...WAREHOUSE_NAME_LOOKUP_QUERY_KEY, storeId],
      queryFn: () => fetchWarehousesForStore(storeId),
      enabled: enabled && storeId > 0,
      staleTime: 60_000,
      retry: false,
    })),
  });

  const storeNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of storesQ.data?.content ?? []) {
      map.set(s.id, s.storeName);
    }
    return map;
  }, [storesQ.data]);

  const warehouseOptions = useMemo(() => {
    const map = new Map<number, WarehouseOption>();
    for (const q of whQueries) {
      for (const w of q.data ?? []) {
        if (map.has(w.warehouseId)) continue;
        map.set(w.warehouseId, {
          warehouseId: w.warehouseId,
          label: formatWarehouseLabel(
            w.warehouseName,
            w.warehouseCode,
            w.storeId,
            storeNameById,
            includeStorePrefix,
            resolvedStoreIds.length,
          ),
        });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [whQueries, storeNameById, includeStorePrefix, resolvedStoreIds.length]);

  const labelByWarehouseId = useMemo(() => {
    const map = new Map<number, string>();
    for (const o of warehouseOptions) {
      map.set(o.warehouseId, o.label);
    }
    return map;
  }, [warehouseOptions]);

  const getWarehouseName = useCallback(
    (warehouseId: number | null | undefined) => {
      if (warehouseId == null || !Number.isFinite(warehouseId) || warehouseId <= 0) return "-";
      return labelByWarehouseId.get(warehouseId) ?? `Kho #${warehouseId}`;
    },
    [labelByWarehouseId],
  );

  const isPending =
    (enabled && !hasExplicitStoreIds && storesQ.isPending) ||
    whQueries.some((q) => q.isPending);

  const isError =
    (enabled && !hasExplicitStoreIds && storesQ.isError) ||
    whQueries.some((q) => q.isError);

  const error =
    (!hasExplicitStoreIds && storesQ.isError ? storesQ.error : null) ??
    whQueries.find((q) => q.isError)?.error ??
    null;

  return {
    warehouseOptions,
    getWarehouseName,
    isPending,
    isError,
    error,
  };
}
