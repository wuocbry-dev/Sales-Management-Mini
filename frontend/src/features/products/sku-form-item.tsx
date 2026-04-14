import { useId, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  normalizeSku,
  pickUniqueSkuCandidate,
  suggestSkuFromPattern,
  useSkuMissingSuggestions,
} from "@/features/products/sku-suggestions";

type SkuFormItemProps = {
  field: ControllerRenderProps<any, any>;
  storeId: number;
  currentFormSkus: string[];
  productCode?: string;
  variantName?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function SkuFormItem({
  field,
  storeId,
  currentFormSkus,
  productCode,
  variantName,
  placeholder,
  disabled,
}: SkuFormItemProps) {
  const listId = useId().replace(/:/g, "-");
  const [focused, setFocused] = useState(false);
  const currentValue = normalizeSku(String(field.value ?? ""));

  const { suggestions, systemSkus } = useSkuMissingSuggestions({
    storeId,
    inputSku: currentValue,
    currentFormSkus,
    enabled: focused,
    limit: 10,
  });

  const patternSku = suggestSkuFromPattern(productCode ?? "", variantName ?? "");
  const occupiedSkus = new Set([...currentFormSkus, ...systemSkus]);
  occupiedSkus.delete(currentValue);
  const suggestedByPattern = pickUniqueSkuCandidate(patternSku, occupiedSkus);
  const showPatternSuggestion = suggestedByPattern.length > 0 && suggestedByPattern !== currentValue;

  return (
    <FormItem>
      <FormLabel>SKU</FormLabel>
      <FormControl>
        <Input
          {...field}
          value={field.value ?? ""}
          onChange={(e) => field.onChange(normalizeSku(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            field.onChange(normalizeSku(String(field.value ?? "")));
            field.onBlur();
            setFocused(false);
          }}
          className="font-mono"
          placeholder={placeholder}
          disabled={disabled}
          list={suggestions.length > 0 ? listId : undefined}
        />
      </FormControl>

      {suggestions.length > 0 ? (
        <>
          <datalist id={listId}>
            {suggestions.map((sku) => (
              <option key={sku} value={sku} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 5).map((sku) => (
              <button
                key={sku}
                type="button"
                className="rounded border border-input bg-muted/40 px-2 py-1 font-mono text-xs hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => field.onChange(sku)}
              >
                {sku}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Gợi ý đuôi SKU còn thiếu (không trùng SKU hiện có).</p>
        </>
      ) : null}

      {showPatternSuggestion ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-input bg-muted/40 px-2 py-1 font-mono text-xs hover:bg-muted"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => field.onChange(suggestedByPattern)}
          >
            Điền theo mẫu: {suggestedByPattern}
          </button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">SKU tự chuẩn hóa in hoa, khoảng trắng thành dấu - khi nhập.</p>

      <FormMessage />
    </FormItem>
  );
}
