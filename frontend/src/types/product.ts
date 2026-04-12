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

/** Cập nhật sản phẩm — `id` null/undefined trên từng biến thể = thêm mới. */
export type ProductVariantUpsertBody = ProductVariantRequestBody & {
  id?: number | null;
};

export type ProductUpdateRequestBody = Omit<ProductCreateRequestBody, "storeId" | "variants"> & {
  variants: ProductVariantUpsertBody[];
};

/** Khớp backend `ProductVariantOptionResponse`. */
export type ProductVariantOptionResponse = {
  variantId: number;
  sku: string;
  variantName: string | null;
  productName: string;
  /** Giá bán niêm yết trên biến thể (điền sẵn đơn giá khi tạo đơn). */
  sellingPrice: string | number;
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

export type ProductImageResponse = {
  imageId: number;
  sortOrder: number | null;
  contentType: string | null;
  fileName: string | null;
  imageUrl: string;
  createdAt: string | null;
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
  images: ProductImageResponse[];
};
