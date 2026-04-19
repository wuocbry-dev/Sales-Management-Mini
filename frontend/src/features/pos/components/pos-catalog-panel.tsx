import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchCategoriesPage } from "@/api/categories-api";
import { fetchPosVariantSearch } from "@/api/products-api";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductVariantOptionResponse } from "@/types/product";

type PosCatalogPanelProps = {
  storeId: number;
  onPickVariant: (v: ProductVariantOptionResponse) => void;
};

export function PosCatalogPanel({ storeId, onPickVariant }: PosCatalogPanelProps) {
  const [manualVariantId, setManualVariantId] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [activeCategoryName, setActiveCategoryName] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["pos", "categories", storeId],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 24, storeId }),
    enabled: storeId > 0,
  });

  const searchSeed = useMemo(() => {
    const k = keyword.trim();
    if (k.length > 0) return k;
    return activeCategoryName;
  }, [keyword, activeCategoryName]);

  const quickVariantsQ = useQuery({
    queryKey: ["pos", "quick-pick", storeId, searchSeed],
    queryFn: () => fetchPosVariantSearch({ storeId, q: searchSeed }),
    enabled: storeId > 0 && searchSeed.trim().length > 0,
  });

  const categories = categoriesQ.data?.content ?? [];
  const quickVariants = (quickVariantsQ.data ?? []).slice(0, 6);

  return (
    <Card className="pos-panel flex h-full min-h-0 flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Catalog / Quick pick</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="rounded-md border border-[hsl(var(--pos-border))] p-2">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Manual select</p>
          <VariantSearchCombobox
            apiNamespace="pos"
            storeId={storeId}
            value={manualVariantId}
            onChange={setManualVariantId}
            onPick={(v) => onPickVariant(v)}
            disabled={storeId <= 0}
          />
        </div>

        <div className="rounded-md border border-[hsl(var(--pos-border))] p-2">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Category quick filter</p>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <Badge variant="muted">No category data</Badge>
            ) : (
              categories.slice(0, 6).map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={activeCategoryName === c.categoryName ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setActiveCategoryName((prev) => (prev === c.categoryName ? "" : c.categoryName))}
                >
                  {c.categoryName}
                </Button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border border-[hsl(var(--pos-border))] p-2">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Quick pick variants</p>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="mb-2 h-11"
            placeholder="Type keyword (sku/name)"
          />
          <div className="grid grid-cols-2 gap-2">
            {quickVariants.length === 0 ? (
              <div className="col-span-2 text-xs text-muted-foreground">No quick pick yet. Pick a category or type keyword.</div>
            ) : (
              quickVariants.map((v) => (
                <Button
                  key={v.variantId}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-14 justify-start whitespace-normal text-left"
                  onClick={() => onPickVariant(v)}
                >
                  <span className="block text-xs font-semibold">{v.sku}</span>
                  <span className="block text-xs text-muted-foreground">{v.variantName || v.productName}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
