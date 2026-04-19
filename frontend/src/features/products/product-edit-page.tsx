import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBrandsPage } from "@/api/brands-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { addProductImages, deleteProductImage, fetchProductById, fetchProductImageBlobUrl, updateProduct } from "@/api/products-api";
import { fetchUnitsPage } from "@/api/units-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AppImage } from "@/components/ui/app-image";
import { Input } from "@/components/ui/input";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { SkuFormItem } from "@/features/products/sku-form-item";
import { normalizeSku } from "@/features/products/sku-suggestions";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import type { ProductResponse, ProductUpdateRequestBody } from "@/types/product";

const MAX_PRODUCT_IMAGES = 4;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variantRowSchema = z.object({
  id: z.number().int().positive().optional(),
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

export type ProductEditFormValues = z.infer<typeof schema>;

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

function normalizeProductType(t: string): "NORMAL" | "SERVICE" {
  const u = t.trim().toUpperCase();
  if (u === "SERVICE") return "SERVICE";
  return "NORMAL";
}

function normalizeVariantStatus(s: string): "ACTIVE" | "INACTIVE" {
  const u = s.trim().toUpperCase();
  return u === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function productToFormValues(p: ProductResponse): ProductEditFormValues {
  const variants =
    p.variants.length > 0
      ? p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode ?? "",
          variantName: v.variantName ?? "",
          attributesJson: v.attributesJson ?? "",
          costPrice: Number(v.costPrice),
          sellingPrice: Number(v.sellingPrice),
          reorderLevel: Number(v.reorderLevel),
          status: normalizeVariantStatus(v.status),
        }))
      : [
          {
            sku: "",
            barcode: "",
            variantName: "",
            attributesJson: "",
            costPrice: 0,
            sellingPrice: 0,
            reorderLevel: 0,
            status: "ACTIVE" as const,
          },
        ];

  return {
    categoryId: p.categoryId != null ? String(p.categoryId) : "",
    brandId: p.brandId != null ? String(p.brandId) : "",
    unitId: p.unitId != null ? String(p.unitId) : "",
    productCode: p.productCode,
    productName: p.productName,
    productType: normalizeProductType(p.productType),
    hasVariant: p.hasVariant,
    trackInventory: p.trackInventory,
    description: p.description ?? "",
    status: normalizeVariantStatus(p.status),
    variants,
  };
}

function buildUpdateBody(values: ProductEditFormValues): ProductUpdateRequestBody {
  return {
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
      id: typeof v.id === "number" && v.id > 0 ? v.id : null,
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
}

export function ProductEditPage() {
  const { id } = useParams();
  const pid = Number(id);
  const invalid = !Number.isFinite(pid) || pid <= 0;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const backFromState =
    typeof (location.state as { from?: unknown } | null)?.from === "string"
      ? (location.state as { from: string }).from
      : null;
  const backTo = backFromState && backFromState.startsWith("/") ? backFromState : "/app/san-pham";

  const productQ = useQuery({
    queryKey: ["products", pid],
    queryFn: () => fetchProductById(pid),
    enabled: !invalid,
  });

  const masterStoreId = productQ.data?.storeId ?? 0;

  const brandsQ = useQuery({
    queryKey: ["product-edit", "brands", masterStoreId],
    queryFn: () => fetchBrandsPage({ page: 0, size: 200, storeId: masterStoreId }),
    enabled: masterStoreId > 0,
  });
  const categoriesQ = useQuery({
    queryKey: ["product-edit", "categories", masterStoreId],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 200, storeId: masterStoreId }),
    enabled: masterStoreId > 0,
  });
  const unitsQ = useQuery({
    queryKey: ["product-edit", "units", masterStoreId],
    queryFn: () => fetchUnitsPage({ page: 0, size: 200, storeId: masterStoreId }),
    enabled: masterStoreId > 0,
  });

  const imageMeta = productQ.data?.images ?? [];
  const imageQ = useQuery({
    queryKey: ["products", pid, "images", imageMeta.map((img) => img.imageId).join(",")],
    enabled: !invalid && imageMeta.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        imageMeta.map(async (img) => ({
          imageId: img.imageId,
          url: await fetchProductImageBlobUrl(img.imageUrl),
        })),
      );
      return settled
        .filter((item): item is PromiseFulfilledResult<{ imageId: number; url: string }> => item.status === "fulfilled")
        .map((item) => item.value);
    },
  });

  const productEditBlobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    (imageQ.data ?? []).forEach((img) => productEditBlobUrlsRef.current.add(img.url));
  }, [imageQ.data]);

  useEffect(() => {
    return () => {
      productEditBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      productEditBlobUrlsRef.current.clear();
    };
  }, []);

  const imageUrlMap = useMemo(
    () => new Map((imageQ.data ?? []).map((img) => [img.imageId, img.url] as const)),
    [imageQ.data],
  );

  const { getStoreName } = useStoreNameMap();

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

  const form = useForm<ProductEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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

  const { reset } = form;
  useEffect(() => {
    if (productQ.data) {
      reset(productToFormValues(productQ.data));
    }
  }, [productQ.data, reset]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });
  const selectedStoreId = productQ.data?.storeId ?? 0;
  const productCodeWatch = form.watch("productCode");
  const variantsWatch = form.watch("variants");
  const currentFormSkus = useMemo(
    () => (variantsWatch ?? []).map((v) => normalizeSku(v?.sku)).filter((v) => v.length > 0),
    [variantsWatch],
  );

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (values: ProductEditFormValues) => {
      if (invalid) throw new Error("invalid");
      return updateProduct(pid, buildUpdateBody(values));
    },
    onSuccess: (data) => {
      toast.success("Đã cập nhật sản phẩm.");
      void queryClient.invalidateQueries({ queryKey: ["products", pid] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void navigate(`/app/san-pham/${data.id}`, { state: { from: backTo } });
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const addImagesM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (files: File[]) => {
      if (invalid) throw new Error("invalid");
      return addProductImages(pid, files);
    },
    onSuccess: async () => {
      toast.success("Đã thêm ảnh sản phẩm.");
      await queryClient.invalidateQueries({ queryKey: ["products", pid] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const deleteImageM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (imageId: number) => {
      if (invalid) throw new Error("invalid");
      await deleteProductImage(pid, imageId);
    },
    onSuccess: async () => {
      toast.success("Đã xóa ảnh sản phẩm.");
      await queryClient.invalidateQueries({ queryKey: ["products", pid] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const deletingImageId = deleteImageM.isPending ? deleteImageM.variables : null;

  function handlePickImages(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;

    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Vui lòng chọn tệp ảnh hợp lệ.");
      return;
    }

    const remain = MAX_PRODUCT_IMAGES - imageMeta.length;
    if (remain <= 0) {
      toast.error(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh cho một sản phẩm.`);
      return;
    }

    const picked = imageFiles.slice(0, remain);
    if (imageFiles.length > remain) {
      toast.warning(`Chỉ lấy ${remain} ảnh đầu tiên do giới hạn ${MAX_PRODUCT_IMAGES} ảnh.`);
    }
    addImagesM.mutate(picked);
  }

  const brandOptions = brandsQ.data?.content ?? [];
  const categoryOptions = categoriesQ.data?.content ?? [];
  const unitOptions = unitsQ.data?.content ?? [];

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Mã sản phẩm không đúng định dạng.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/san-pham">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (productQ.isPending) return <PageSkeleton cards={2} />;
  if (productQ.isError) return <ApiErrorState error={productQ.error} onRetry={() => void productQ.refetch()} />;

  const storeId = productQ.data.storeId;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={backTo}>← Quay lại</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sửa sản phẩm</CardTitle>
          <CardDescription>
            Cập nhật thông tin chung, ảnh sản phẩm và biến thể (SKU). Có thể thêm biến thể mới (dòng không có mã nội
            bộ). Xóa dòng biến thể chỉ thực hiện được khi SKU đó chưa phát sinh đơn hàng, phiếu kho hoặc tồn kho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Thông tin chung</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Cửa hàng (cố định): </span>
                    <span className="font-medium">{getStoreName(storeId)}</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã sản phẩm</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên sản phẩm</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhóm hàng (tuỳ chọn)</FormLabel>
                        <FormControl>
                          <select {...field} className={selectClass} disabled={categoriesQ.isError}>
                            <option value="">— Không chọn —</option>
                            {categoryOptions.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.categoryName}
                              </option>
                            ))}
                          </select>
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
                        <FormLabel>Thương hiệu (tuỳ chọn)</FormLabel>
                        <FormControl>
                          <select {...field} className={selectClass} disabled={brandsQ.isError}>
                            <option value="">— Không chọn —</option>
                            {brandOptions.map((b) => (
                              <option key={b.id} value={String(b.id)}>
                                {b.brandName}
                              </option>
                            ))}
                          </select>
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
                        <FormLabel>Đơn vị tính (tuỳ chọn)</FormLabel>
                        <FormControl>
                          <select {...field} className={selectClass} disabled={unitsQ.isError}>
                            <option value="">— Không chọn —</option>
                            {unitOptions.map((u) => (
                              <option key={u.id} value={String(u.id)}>
                                {u.unitName}
                              </option>
                            ))}
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
                        <FormLabel>Mô tả (tuỳ chọn)</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="hasVariant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-1">
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
                  <FormField
                    control={form.control}
                    name="trackInventory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-1">
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
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Hình ảnh sản phẩm</h3>
                    <p className="text-xs text-muted-foreground">Tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh không quá 2MB.</p>
                  </div>
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
                    onClick={() => imageInputRef.current?.click()}
                    disabled={addImagesM.isPending || imageMeta.length >= MAX_PRODUCT_IMAGES}
                  >
                    {addImagesM.isPending ? "Đang tải ảnh..." : "Thêm ảnh"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: MAX_PRODUCT_IMAGES }).map((_, slotIdx) => {
                    const image = imageMeta[slotIdx];
                    if (!image) {
                      return (
                        <div
                          key={`slot-${slotIdx}`}
                          className="flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground"
                        >
                          Ảnh {slotIdx + 1}
                        </div>
                      );
                    }

                    const previewUrl = imageUrlMap.get(image.imageId);
                    return (
                      <div key={image.imageId} className="relative h-28">
                        <AppImage
                          src={previewUrl}
                          alt={`Ảnh sản phẩm ${image.imageId}`}
                          loading="eager"
                          containerClassName="h-full w-full"
                          fallback="Đang tải ảnh..."
                          fallbackClassName="text-xs"
                        />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                          disabled={deletingImageId === image.imageId}
                          onClick={() => {
                            if (!window.confirm("Xóa ảnh này khỏi sản phẩm?")) return;
                            deleteImageM.mutate(image.imageId);
                          }}
                        >
                          {deletingImageId === image.imageId ? "..." : "Xóa"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {imageQ.isError ? <p className="text-xs text-destructive">Không tải được ảnh hiện có của sản phẩm.</p> : null}
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Biến thể</h3>
                    <p className="text-xs text-muted-foreground">
                      Dòng có sẵn là biến thể đã lưu; thêm dòng mới để tạo SKU bổ sung.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => append(defaultVariant)}>
                    Thêm dòng biến thể
                  </Button>
                </div>

                <div className="space-y-6">
                  {fields.map((row, index) => (
                    <Card key={row.id} className="border-dashed">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                        <CardTitle className="text-sm font-medium">Biến thể {index + 1}</CardTitle>
                        {fields.length > 1 ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                            Xóa dòng
                          </Button>
                        ) : null}
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
                              <FormLabel>Thuộc tính mở rộng (tuỳ chọn)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ví dụ: màu, size…" />
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
                  ))}
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={backTo}>Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
