/** Khớp `MasterDataDtos` — JSON camelCase. */

export type StoreRequest = {
  storeCode: string;
  storeName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
};

export type StoreResponse = {
  id: number;
  storeCode: string;
  storeName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type BrandRequest = {
  storeId?: number | null;
  brandCode: string;
  brandName: string;
  description?: string | null;
  status: string;
};

export type BrandResponse = {
  id: number;
  storeId: number;
  brandCode: string;
  brandName: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRequest = {
  storeId?: number | null;
  parentId?: number | null;
  categoryCode: string;
  categoryName: string;
  description?: string | null;
  status: string;
};

export type CategoryResponse = {
  id: number;
  storeId: number;
  parentId: number | null;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UnitRequest = {
  storeId?: number | null;
  unitCode: string;
  unitName: string;
  description?: string | null;
};

export type UnitResponse = {
  id: number;
  storeId: number;
  unitCode: string;
  unitName: string;
  description: string | null;
  createdAt: string;
};

export type SupplierRequest = {
  storeId?: number | null;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
};

export type SupplierResponse = {
  id: number;
  storeId: number;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
