import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBrandsPage } from "@/api/brands-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { createProductWithImages } from "@/api/products-api";
import { fetchUnitsPage } from "@/api/units-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isSystemManage } from "@/features/auth/access";
import { gateProductCatalogMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { BrandFormDialog } from "@/features/brands/brand-form-dialog";
import { CategoryFormDialog } from "@/features/categories/category-form-dialog";
import { LocalOptionCombobox } from "@/components/catalog/local-option-combobox";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { SkuFormItem } from "@/features/products/sku-form-item";
import { normalizeSku } from "@/features/products/sku-suggestions";
import { UnitFormDialog } from "@/features/units/unit-form-dialog";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import type { MeResponse } from "@/types/auth";
import type { ProductCreateRequestBody } from "@/types/product";

const MAX_PRODUCT_IMAGES = 4;

type LocalProductImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variantRowSchema = z.object({
  sku: z.string().min(1, "Bắt buộc").max(100),
  barcode: z.string().max(100).optional(),
  variantName: z.string().max(255).optional(),
  attributesJson: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Không được âm"),
  sellingPrice: z.coerce.number().min(0, "Không được âm"),
  reorderLevel: z.coerce.number().min(0, "Không được âm"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const schema = z.object({
  storeId: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
  productCode: z.string().min(1, "Bắt buộc").max(50),
  productName: z.string().min(1, "Bắt buộc").max(255),
  productType: z.enum(["NORMAL", "SERVICE"]),
  hasVariant: z.boolean(),
  trackInventory: z.boolean(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  variants: z.array(variantRowSchema).min(1, "Cần ít nhất một dòng biến thể"),
});

export type ProductCreateFormValues = z.infer<typeof schema>;

function emptyToNullId(s: string | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function trimOrUndef(s: string | undefined | null): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t === "" ? undefined : t;
}

function buildBody(values: ProductCreateFormValues, me: MeResponse): ProductCreateRequestBody {
  if (!me) throw new Error("Chưa đăng nhập");
  const needStorePicker = isSystemManage(me) || me.storeIds.length > 1;
  const body: ProductCreateRequestBody = {
    categoryId: emptyToNullId(values.categoryId),
    brandId: emptyToNullId(values.brandId),
    unitId: emptyToNullId(values.unitId),
    productCode: values.productCode.trim(),
    productName: values.productName.trim(),
    productType: values.productType,
    hasVariant: values.hasVariant,
    trackInventory: values.trackInventory,
    description: values.description?.trim() ? values.description.trim() : null,
    status: values.status,
    variants: values.variants.map((v) => ({
      sku: normalizeSku(v.sku),
      barcode: trimOrUndef(v.barcode) ?? null,
      variantName: trimOrUndef(v.variantName) ?? null,
      attributesJson: trimOrUndef(v.attributesJson) ?? null,
      costPrice: v.costPrice,
      sellingPrice: v.sellingPrice,
      reorderLevel: v.reorderLevel,
      status: v.status,
    })),
  };
  if (needStorePicker) {
    const sid = Number(values.storeId);
    body.storeId = Number.isFinite(sid) && sid > 0 ? sid : null;
  }
  return body;
}

export function ProductCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<LocalProductImage[]>([]);
  const needStorePicker = Boolean(me && (isSystemManage(me) || me.storeIds.length > 1));
  const canCreateCatalogMaster = Boolean(me && gateProductCatalogMutate(me));
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);

  const { stores: storePickerList, getStoreName, isPending: storesPending, isError: storesError } = useStoreNameMap();

  const defaultVariant = useMemo(
    () => ({
      sku: "",
      barcode: "",
      variantName: "",
      attributesJson: "",
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 0,
      status: "ACTIVE" as const,
    }),
    [],
  );

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      categoryId: "",
      brandId: "",
      unitId: "",
      productCode: "",
      productName: "",
      productType: "NORMAL",
      hasVariant: false,
      trackInventory: true,
      description: "",
      status: "ACTIVE",
      variants: [defaultVariant],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });
  const hasVariant = form.watch("hasVariant");
  const productCodeWatch = form.watch("productCode");
  const selectedStoreId = needStorePicker ? Number(form.watch("storeId")) || 0 : (me?.storeIds[0] ?? 0);
  const variantsWatch = form.watch("variants");
  const masterDataEnabled = selectedStoreId > 0;
  const previousMasterStoreIdRef = useRef<number>(selectedStoreId);

  const brandsQ = useQuery({
    queryKey: ["product-create", "brands", selectedStoreId],
    queryFn: () => fetchBrandsPage({ page: 0, size: 200, storeId: selectedStoreId }),
    enabled: masterDataEnabled,
  });
  const categoriesQ = useQuery({
    queryKey: ["product-create", "categories", selectedStoreId],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 200, storeId: selectedStoreId }),
    enabled: masterDataEnabled,
  });
  const unitsQ = useQuery({
    queryKey: ["product-create", "units", selectedStoreId],
    queryFn: () => fetchUnitsPage({ page: 0, size: 200, storeId: selectedStoreId }),
    enabled: masterDataEnabled,
  });

  useEffect(() => {
    if (hasVariant || fields.length <= 1) {
      return;
    }
    const firstVariant = form.getValues("variants.0") ?? defaultVariant;
    form.setValue("variants", [firstVariant], { shouldDirty: true, shouldValidate: true });
  }, [defaultVariant, fields.length, form, hasVariant]);

  useEffect(() => {
    if (!needStorePicker) {
      return;
    }
    if (previousMasterStoreIdRef.current === selectedStoreId) {
      return;
    }
    previousMasterStoreIdRef.current = selectedStoreId;
    form.setValue("categoryId", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("brandId", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("unitId", "", { shouldDirty: true, shouldValidate: true });
  }, [form, needStorePicker, selectedStoreId]);

  const currentFormSkus = useMemo(
    () => (variantsWatch ?? []).map((v) => normalizeSku(v?.sku)).filter((v) => v.length > 0),
    [variantsWatch],
  );

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  function handlePickImages(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;

    const fileArray = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Vui lòng chọn tệp ảnh hợp lệ.");
      return;
    }

    const remain = MAX_PRODUCT_IMAGES - images.length;
    if (remain <= 0) {
      toast.error(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh cho một sản phẩm.`);
      return;
    }

    const picked = fileArray.slice(0, remain).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (fileArray.length > remain) {
      toast.warning(`Chỉ lấy ${remain} ảnh đầu tiên do giới hạn ${MAX_PRODUCT_IMAGES} ảnh.`);
    }

    setImages((prev) => [...prev, ...picked]);
  }

  function handleRemoveImage(id: string): void {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (values: ProductCreateFormValues) => {
      if (!me) throw new Error("Chưa đăng nhập");
      if (needStorePicker) {
        const sid = Number(values.storeId);
        if (!Number.isFinite(sid) || sid <= 0) {
          form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
          throw new Error("validation");
        }
      }
      const body = buildBody(values, me);
      return createProductWithImages(
        body,
        images.map((img) => img.file),
      );
    },
    onSuccess: (data) => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      toast.success("Đã tạo sản phẩm.");
      void navigate(`/app/san-pham/${data.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const storeOptions = storePickerList;
  const brandOptions = masterDataEnabled ? (brandsQ.data?.content ?? []) : [];
  const categoryOptions = masterDataEnabled ? (categoriesQ.data?.content ?? []) : [];
  const unitOptions = masterDataEnabled ? (unitsQ.data?.content ?? []) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/san-pham">← Quay lại danh sách</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo hàng hóa</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <section className="rounded-lg border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold text-foreground">Hướng dẫn nhanh</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Nhập thông tin sản phẩm ở phần Thông tin sản phẩm.</li>
                  <li>Nhập SKU và giá ở phần Biến thể mặc định.</li>
                  <li>Nếu có nhiều màu hoặc size, bật tùy chọn nhiều biến thể rồi thêm dòng.</li>
                </ol>
              </section>

              <section className="grid gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-8">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Thông tin sản phẩm</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {needStorePicker ? (
                      <FormField
                        control={form.control}
                        name="storeId"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Cửa hàng</FormLabel>
                            <FormControl>
                              <select {...field} className={selectClass} disabled={storesPending}>
                                <option value="">— Chọn —</option>
                                {storeOptions.map((s) => (
                                  <option key={s.id} value={String(s.id)}>
                                    {s.storeName} ({s.storeCode})
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                            {storesError ? <p className="text-xs text-destructive">Không tải được danh sách cửa hàng.</p> : null}
                          </FormItem>
                        )}
                      />
                    ) : me && me.storeIds.length === 1 ? (
                      <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Cửa hàng áp dụng: </span>
                        <span className="font-medium">{getStoreName(me.storeIds[0])}</span>
                      </div>
                    ) : null}

                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên hàng</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ví dụ: Nước ngọt lon 330ml" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã sản phẩm</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="off" placeholder="Ví dụ: SP001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Nhóm hàng (tùy chọn)</FormLabel>
                            {canCreateCatalogMaster ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => {
                                  if (!masterDataEnabled) {
                                    toast.error("Vui lòng chọn cửa hàng trước.");
                                    return;
                                  }
                                  setCategoryDialogOpen(true);
                                }}
                              >
                                Khác
                              </button>
                            ) : null}
                          </div>
                          <FormControl>
                            <LocalOptionCombobox
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={categoryOptions.map((c) => ({ id: c.id, label: c.categoryName }))}
                              placeholder="Chọn nhóm hàng"
                              disabled={!masterDataEnabled || categoriesQ.isError || categoriesQ.isPending}
                              noResultsText={masterDataEnabled ? "Không có nhóm hàng phù hợp." : "Chọn cửa hàng trước."}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brandId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Thương hiệu (tùy chọn)</FormLabel>
                            {canCreateCatalogMaster ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => {
                                  if (!masterDataEnabled) {
                                    toast.error("Vui lòng chọn cửa hàng trước.");
                                    return;
                                  }
                                  setBrandDialogOpen(true);
                                }}
                              >
                                Khác
                              </button>
                            ) : null}
                          </div>
                          <FormControl>
                            <LocalOptionCombobox
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={brandOptions.map((b) => ({ id: b.id, label: b.brandName }))}
                              placeholder="Chọn thương hiệu"
                              disabled={!masterDataEnabled || brandsQ.isError || brandsQ.isPending}
                              noResultsText={masterDataEnabled ? "Không có thương hiệu phù hợp." : "Chọn cửa hàng trước."}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Đơn vị tính (tùy chọn)</FormLabel>
                            {canCreateCatalogMaster ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => {
                                  if (!masterDataEnabled) {
                                    toast.error("Vui lòng chọn cửa hàng trước.");
                                    return;
                                  }
                                  setUnitDialogOpen(true);
                                }}
                              >
                                Khác
                              </button>
                            ) : null}
                          </div>
                          <FormControl>
                            <LocalOptionCombobox
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={unitOptions.map((u) => ({ id: u.id, label: u.unitName }))}
                              placeholder="Chọn đơn vị"
                              disabled={!masterDataEnabled || unitsQ.isError || unitsQ.isPending}
                              noResultsText={masterDataEnabled ? "Không có đơn vị phù hợp." : "Chọn cửa hàng trước."}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại hàng</FormLabel>
                          <FormControl>
                            <select {...field} className={selectClass}>
                              <option value="NORMAL">Hàng hóa</option>
                              <option value="SERVICE">Dịch vụ</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trạng thái</FormLabel>
                          <FormControl>
                            <select {...field} className={selectClass}>
                              <option value="ACTIVE">Đang hoạt động</option>
                              <option value="INACTIVE">Ngưng hoạt động</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Mô tả (tùy chọn)</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={3}
                              className={cn(
                                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Hình ảnh</CardTitle>
                    <CardDescription>Tối đa {MAX_PRODUCT_IMAGES} ảnh</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handlePickImages(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={images.length >= MAX_PRODUCT_IMAGES}
                    >
                      Thêm ảnh
                    </Button>
                    <p className="text-xs text-muted-foreground">Mỗi ảnh nên nhỏ hơn 2MB để tải nhanh.</p>

                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: MAX_PRODUCT_IMAGES }).map((_, slotIdx) => {
                        const img = images[slotIdx];
                        if (!img) {
                          return (
                            <div
                              key={`slot-${slotIdx}`}
                              className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground"
                            >
                              Ảnh {slotIdx + 1}
                            </div>
                          );
                        }
                        return (
                          <div key={img.id} className="relative h-24 overflow-hidden rounded-md border">
                            <img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                              onClick={() => handleRemoveImage(img.id)}
                              aria-label="Xóa ảnh"
                            >
                              Xóa
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Biến thể mặc định</CardTitle>
                    <CardDescription>
                      Bắt buộc phải có.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="variants.0.sku"
                      render={({ field }) => (
                        <SkuFormItem
                          field={field}
                          storeId={selectedStoreId}
                          currentFormSkus={currentFormSkus}
                          productCode={productCodeWatch}
                          variantName={variantsWatch?.[0]?.variantName ?? ""}
                          placeholder="Ví dụ: SP001-MACDINH"
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="variants.0.variantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên biến thể (tùy chọn)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ví dụ: Mặc định" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="variants.0.barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã vạch (tùy chọn)</FormLabel>
                          <FormControl>
                            <Input {...field} className="font-mono" placeholder="Nhập mã vạch" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="variants.0.costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá vốn</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min={0} step="0.01" inputMode="decimal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="variants.0.sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá bán</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min={0} step="0.01" inputMode="decimal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="variants.0.reorderLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mức tồn tối thiểu</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min={0} step="0.001" inputMode="decimal" />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Không theo dõi tồn kho thì để 0.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trackInventory"
                      render={({ field }) => (
                        <FormItem className="flex h-full flex-row items-center gap-2 space-y-0 rounded-md border px-3 py-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border border-input"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 font-normal">Theo dõi tồn kho</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="variants.0.status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trạng thái biến thể</FormLabel>
                          <FormControl>
                            <select {...field} className={selectClass}>
                              <option value="ACTIVE">Đang hoạt động</option>
                              <option value="INACTIVE">Ngưng hoạt động</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="variants.0.attributesJson"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 lg:col-span-3">
                          <FormLabel>Thuộc tính mở rộng (tùy chọn)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='Ví dụ: "color":"red","size":"M"' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </section>

              <section className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Nhiều biến thể</h3>
                    <p className="text-xs text-muted-foreground">
                      Bật mục này khi sản phẩm có thêm màu hoặc size. Biến thể mặc định ở trên luôn được giữ lại.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasVariant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-input"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal">Sản phẩm có nhiều biến thể</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {hasVariant ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button type="button" variant="secondary" onClick={() => append(defaultVariant)}>
                        Thêm dòng biến thể
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {fields.slice(1).map((row, offset) => {
                        const index = offset + 1;
                        return (
                          <Card key={row.id} className="border-dashed">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                              <CardTitle className="text-sm font-medium">Biến thể phụ {index}</CardTitle>
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                Xóa dòng
                              </Button>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`variants.${index}.sku`}
                                render={({ field }) => (
                                  <SkuFormItem
                                    field={field}
                                    storeId={selectedStoreId}
                                    currentFormSkus={currentFormSkus}
                                    productCode={productCodeWatch}
                                    variantName={variantsWatch?.[index]?.variantName ?? ""}
                                  />
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.barcode`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mã vạch</FormLabel>
                                    <FormControl>
                                      <Input {...field} className="font-mono" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.variantName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tên hiển thị</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.attributesJson`}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-2">
                                    <FormLabel>Thuộc tính mở rộng (tùy chọn)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Ví dụ: màu, size..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.costPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Giá vốn</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" min={0} step="0.01" inputMode="decimal" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.sellingPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Giá bán</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" min={0} step="0.01" inputMode="decimal" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.reorderLevel`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mức đặt lại hàng</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" min={0} step="0.001" inputMode="decimal" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.status`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Trạng thái</FormLabel>
                                    <FormControl>
                                      <select {...field} className={selectClass}>
                                        <option value="ACTIVE">Đang hoạt động</option>
                                        <option value="INACTIVE">Ngưng hoạt động</option>
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </section>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Đang lưu…" : "Lưu sản phẩm"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/san-pham">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {canCreateCatalogMaster ? (
        <>
          <CategoryFormDialog
            mode="create"
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
            storeId={selectedStoreId > 0 ? selectedStoreId : undefined}
            onSuccess={(saved) => {
              void categoriesQ.refetch();
              if (saved?.id) {
                form.setValue("categoryId", String(saved.id), { shouldDirty: true, shouldValidate: true });
              }
            }}
          />
          <BrandFormDialog
            mode="create"
            open={brandDialogOpen}
            onOpenChange={setBrandDialogOpen}
            storeId={selectedStoreId > 0 ? selectedStoreId : undefined}
            onSuccess={(saved) => {
              void brandsQ.refetch();
              if (saved?.id) {
                form.setValue("brandId", String(saved.id), { shouldDirty: true, shouldValidate: true });
              }
            }}
          />
          <UnitFormDialog
            mode="create"
            open={unitDialogOpen}
            onOpenChange={setUnitDialogOpen}
            storeId={selectedStoreId > 0 ? selectedStoreId : undefined}
            onSuccess={(saved) => {
              void unitsQ.refetch();
              if (saved?.id) {
                form.setValue("unitId", String(saved.id), { shouldDirty: true, shouldValidate: true });
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}
