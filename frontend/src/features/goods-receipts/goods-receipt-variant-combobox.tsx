import { useQuery } from "@tanstack/react-query";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { fetchProductVariantSearch } from "@/api/products-api";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductVariantOptionResponse } from "@/types/product";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function optionLabel(row: ProductVariantOptionResponse): string {
  const name = row.variantName?.trim() ? row.variantName.trim() : "—";
  return `${row.sku} - ${name}`;
}

type GoodsReceiptVariantComboboxProps = {
  storeId: number;
  value: number;
  onChange: (variantId: number) => void;
  onBlur: () => void;
  name: string;
  disabled?: boolean;
  id?: string;
};

export const GoodsReceiptVariantCombobox = forwardRef<HTMLInputElement, GoodsReceiptVariantComboboxProps>(
  function GoodsReceiptVariantCombobox({ storeId, value, onChange, onBlur, name, disabled, id }, ref) {
    const listId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const debouncedText = useDebouncedValue(text, 280);

    const searchEnabled = storeId > 0 && debouncedText.trim().length > 0;

    const query = useQuery({
      queryKey: ["product-variant-search", storeId, debouncedText.trim()],
      queryFn: () => fetchProductVariantSearch({ storeId, q: debouncedText.trim() }),
      enabled: searchEnabled,
      staleTime: 30_000,
    });

    const options = query.data ?? [];
    const showList = open && storeId > 0 && debouncedText.trim().length > 0;

    useEffect(() => {
      function onDocMouseDown(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", onDocMouseDown);
      return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    const pick = useCallback(
      (row: ProductVariantOptionResponse) => {
        onChange(row.variantId);
        setText(optionLabel(row));
        setOpen(false);
      },
      [onChange],
    );

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          id={id}
          name={name}
          autoComplete="off"
          disabled={disabled || storeId <= 0}
          placeholder={storeId <= 0 ? "Chọn cửa hàng trước" : "Gõ SKU hoặc tên biến thể…"}
          value={text}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          className="font-mono text-sm"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            setOpen(true);
            if (value > 0 || next.trim() === "") {
              onChange(0);
            }
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            onBlur();
          }}
        />
        {showList ? (
          <div
            id={listId}
            role="listbox"
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
            )}
          >
            {query.isFetching ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Không có kết quả.</div>
            ) : (
              options.map((row) => (
                <button
                  key={row.variantId}
                  type="button"
                  role="option"
                  className="flex w-full cursor-pointer select-none px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(row)}
                >
                  <span className="break-all">{optionLabel(row)}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  },
);
