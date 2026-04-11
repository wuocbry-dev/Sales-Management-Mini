/** Khớp backend `ProductDtos` (JSON camelCase). */

export type ProductVariantRequestBody = {
  sku: string;
  barcode?: string | null;
  variantName?: string | null;
  attributesJson?: string | null;
  costPrice: string | number;
  sellingPrice: string | number;
  reorderLevel: string | number;
  status: string;
};

export type ProductCreateRequestBody = {
  categoryId?: number | null;
  brandId?: number | null;
  unitId?: number | null;
  storeId?: number | null;
  productCode: string;
  productName: string;
  productType: string;
  hasVariant: boolean;
  trackInventory: boolean;
  description?: string | null;
  status: string;
  variants: ProductVariantRequestBody[];
};

export type ProductVariantResponse = {
  id: number;
  productId: number;
  sku: string;
  barcode: string | null;
  variantName: string | null;
  attributesJson: string | null;
  costPrice: string;
  sellingPrice: string;
  reorderLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductResponse = {
  id: number;
  storeId: number;
  categoryId: number | null;
  brandId: number | null;
  unitId: number | null;
  productCode: string;
  productName: string;
  productType: string;
  hasVariant: boolean;
  trackInventory: boolean;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariantResponse[];
};
