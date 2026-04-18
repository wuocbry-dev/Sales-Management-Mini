import type { ProductVariantOptionResponse } from "@/types/product";

export type PosCartLine = {
  variantId: number;
  sku: string;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  availableQty: number | null;
};

export function toPosCartLine(v: ProductVariantOptionResponse): PosCartLine {
  const price = typeof v.sellingPrice === "number" ? v.sellingPrice : Number(v.sellingPrice);
  return {
    variantId: v.variantId,
    sku: v.sku,
    productName: v.productName,
    variantName: v.variantName,
    unitPrice: Number.isFinite(price) ? price : 0,
    quantity: 1,
    discountAmount: 0,
    availableQty: null,
  };
}

export function displayVariantName(line: PosCartLine): string {
  if (line.variantName && line.variantName.trim().length > 0) {
    return `${line.productName} - ${line.variantName}`;
  }
  return line.productName;
}
