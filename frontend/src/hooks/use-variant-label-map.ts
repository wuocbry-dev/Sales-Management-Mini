import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchProductsPage } from "@/api/products-api";

type Options = {
  enabled?: boolean;
  size?: number;
};

export const VARIANT_LABEL_LOOKUP_QUERY_KEY = ["products", "variant-lookup-by-id"] as const;

function formatVariantLabel(params: {
  variantId: number;
  sku: string | null;
  productName: string;
  variantName: string | null;
}): string {
  const sku = params.sku?.trim() ?? "";
  const productName = params.productName.trim();
  const variantName = params.variantName?.trim() ?? "";
  const name = variantName ? `${productName} - ${variantName}` : productName;
  if (sku && name) return `${sku} - ${name}`;
  if (sku) return sku;
  if (name) return name;
  return `Bien the #${params.variantId}`;
}

export function useVariantLabelMap(options?: Options) {
  const enabled = options?.enabled !== false;
  const size = options?.size ?? 500;

  const q = useQuery({
    queryKey: [...VARIANT_LABEL_LOOKUP_QUERY_KEY, size],
    queryFn: () => fetchProductsPage({ page: 0, size }),
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const byId = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of q.data?.content ?? []) {
      for (const v of p.variants ?? []) {
        if (map.has(v.id)) continue;
        map.set(
          v.id,
          formatVariantLabel({
            variantId: v.id,
            sku: v.sku,
            productName: p.productName,
            variantName: v.variantName,
          }),
        );
      }
    }
    return map;
  }, [q.data]);

  const getVariantLabel = useCallback(
    (variantId: number | null | undefined) => {
      if (variantId == null || !Number.isFinite(variantId) || variantId <= 0) return "-";
      return byId.get(variantId) ?? `Bien the #${variantId}`;
    },
    [byId],
  );

  return {
    ...q,
    getVariantLabel,
  };
}
