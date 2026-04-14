import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProductVariantSearch } from "@/api/products-api";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_SUGGESTION_LIMIT = 12;
const MAX_COMBINATIONS = 240;

function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeSku(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function splitSkuTokens(value: string): string[] {
  return value
    .split("-")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function startsWithTokens(tokens: string[], prefixTokens: string[]): boolean {
  if (tokens.length < prefixTokens.length) return false;
  for (let i = 0; i < prefixTokens.length; i++) {
    if (tokens[i] !== prefixTokens[i]) return false;
  }
  return true;
}

function buildCartesian(optionsByPosition: string[][], cap: number): string[][] {
  let acc: string[][] = [[]];
  for (const options of optionsByPosition) {
    const next: string[][] = [];
    for (const prefix of acc) {
      for (const option of options) {
        next.push([...prefix, option]);
        if (next.length >= cap) return next;
      }
    }
    acc = next;
    if (acc.length === 0) return [];
  }
  return acc;
}

export function normalizeSku(value: string | null | undefined): string {
  return (value ?? "")
    .toUpperCase()
    .replace(/[\u2013\u2014]+/g, "-")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function suggestSkuFromPattern(productCode: string, variantName?: string | null): string {
  const base = normalizeSku(productCode);
  if (!base) return "";

  const detail = normalizeSku(variantName);
  if (!detail) return base;

  const baseTokens = splitSkuTokens(base);
  const detailTokens = splitSkuTokens(detail);
  if (detailTokens.length === 0) return base;

  if (startsWithTokens(detailTokens, baseTokens)) {
    return detail;
  }

  return normalizeSku(`${base}-${detail}`);
}

export function pickUniqueSkuCandidate(baseSku: string, occupiedSkus: Iterable<string>): string {
  const normalizedBase = normalizeSku(baseSku);
  if (!normalizedBase) return "";

  const occupied = new Set(uniqueNormalized(Array.from(occupiedSkus)));
  if (!occupied.has(normalizedBase)) return normalizedBase;

  for (let i = 2; i < 10_000; i++) {
    const candidate = `${normalizedBase}-${i}`;
    if (!occupied.has(candidate)) return candidate;
  }

  return normalizedBase;
}

export function buildMissingSkuSuggestions(prefix: string, sourceSkus: string[], limit: number): string[] {
  const normalizedPrefix = normalizeSku(prefix);
  if (normalizedPrefix.length < MIN_QUERY_LENGTH) return [];

  const prefixTokens = splitSkuTokens(normalizedPrefix);
  if (prefixTokens.length === 0) return [];

  const normalizedSource = uniqueNormalized(sourceSkus);
  const existingSet = new Set(normalizedSource);
  const groupedRows = new Map<number, string[][]>();

  for (const sku of normalizedSource) {
    if (!sku.startsWith(normalizedPrefix) && !sku.startsWith(prefixTokens[0])) continue;
    const tokens = splitSkuTokens(sku);
    if (tokens.length <= prefixTokens.length) continue;
    if (!startsWithTokens(tokens, prefixTokens)) continue;
    const rows = groupedRows.get(tokens.length) ?? [];
    rows.push(tokens);
    groupedRows.set(tokens.length, rows);
  }

  if (groupedRows.size === 0) return [];

  const generated = new Set<string>();

  for (const [tokenLength, rows] of groupedRows.entries()) {
    const optionsByPosition: string[][] = [];
    for (let pos = prefixTokens.length; pos < tokenLength; pos++) {
      const options = [...new Set(rows.map((r) => r[pos]).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "vi"),
      );
      if (options.length === 0) {
        optionsByPosition.length = 0;
        break;
      }
      optionsByPosition.push(options);
    }
    if (optionsByPosition.length === 0) continue;

    const combos = buildCartesian(optionsByPosition, MAX_COMBINATIONS);
    for (const suffixTokens of combos) {
      const candidate = [...prefixTokens, ...suffixTokens].join("-");
      if (!existingSet.has(candidate)) {
        generated.add(candidate);
      }
      if (generated.size >= limit * 4) break;
    }
    if (generated.size >= limit * 4) break;
  }

  return [...generated].sort((a, b) => a.localeCompare(b, "vi")).slice(0, limit);
}

type UseSkuMissingSuggestionsParams = {
  storeId: number;
  inputSku: string;
  currentFormSkus: string[];
  enabled?: boolean;
  limit?: number;
};

export function useSkuMissingSuggestions(params: UseSkuMissingSuggestionsParams) {
  const normalizedInput = normalizeSku(params.inputSku);
  const limit = params.limit ?? DEFAULT_SUGGESTION_LIMIT;
  const enabled =
    (params.enabled ?? true) &&
    params.storeId > 0 &&
    normalizedInput.length >= MIN_QUERY_LENGTH;

  const q = useQuery({
    queryKey: ["products", "sku-suggest", params.storeId, normalizedInput],
    queryFn: () => fetchProductVariantSearch({ storeId: params.storeId, q: normalizedInput }),
    enabled,
    staleTime: 20_000,
    retry: false,
  });

  const systemSkus = useMemo(
    () => uniqueNormalized((q.data ?? []).map((row) => row.sku)),
    [q.data],
  );

  const suggestions = useMemo(() => {
    const missing = buildMissingSkuSuggestions(normalizedInput, systemSkus, limit);
    const blocked = new Set(uniqueNormalized(params.currentFormSkus));
    blocked.delete(normalizedInput);

    return missing
      .filter((candidate) => !blocked.has(candidate) && candidate !== normalizedInput)
      .slice(0, limit);
  }, [normalizedInput, systemSkus, limit, params.currentFormSkus]);

  return {
    ...q,
    systemSkus,
    suggestions,
  };
}
