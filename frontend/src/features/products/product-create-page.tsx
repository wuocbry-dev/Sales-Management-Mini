import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBrandsPage } from "@/api/brands-api";
import { fetchCategoriesPage } from "@/api/categories-api";
import { createProduct } from "@/api/products-api";
import { fetchStoresPage } from "@/api/stores-api";
import { fetchUnitsPage } from "@/api/units-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { ProductCreateRequestBody } from "@/types/product";

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
      sku: v.sku.trim(),
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
  const needStorePicker = Boolean(me && (isSystemManage(me) || me.storeIds.length > 1));

  const storesQ = useQuery({
    queryKey: ["product-create", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    enabled: Boolean(needStorePicker),
  });
  const brandsQ = useQuery({
    queryKey: ["product-create", "brands"],
    queryFn: () => fetchBrandsPage({ page: 0, size: 200 }),
  });
  const categoriesQ = useQuery({
    queryKey: ["product-create", "categories"],
    queryFn: () => fetchCategoriesPage({ page: 0, size: 200 }),
  });
  const unitsQ = useQuery({
    queryKey: ["product-create", "units"],
    queryFn: () => fetchUnitsPage({ page: 0, size: 200 }),
  });

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
      return createProduct(body);
    },
    onSuccess: (data) => {
      toast.success("Đã tạo sản phẩm.");
      void navigate(`/app/san-pham/${data.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const storeOptions = storesQ.data?.content ?? [];
  const brandOptions = brandsQ.data?.content ?? [];
  const categoryOptions = categoriesQ.data?.content ?? [];
  const unitOptions = unitsQ.data?.content ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/san-pham">← Quay lại danh sách</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Thêm sản phẩm</CardTitle>
          <CardDescription>
            Điền thông tin chung và ít nhất một biến thể (SKU, giá, mức đặt lại hàng). Mã sản phẩm là duy nhất trong
            phạm vi một cửa hàng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Thông tin chung</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {needStorePicker ? (
                    <FormField
                      control={form.control}
                      name="storeId"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Cửa hàng</FormLabel>
                          <FormControl>
                            <select {...field} className={selectClass} disabled={storesQ.isPending}>
                              <option value="">— Chọn —</option>
                              {storeOptions.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.storeName} ({s.storeCode})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                          {storesQ.isError ? (
                            <p className="text-xs text-destructive">Không tải được danh sách cửa hàng.</p>
                          ) : null}
                        </FormItem>
                      )}
                    />
                  ) : me && me.storeIds.length === 1 ? (
                    <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Cửa hàng áp dụng: </span>
                      <span className="font-medium tabular-nums">{me.storeIds[0]}</span>
                      <span className="text-muted-foreground"> (theo phạm vi đăng nhập)</span>
                    </div>
                  ) : null}

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
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Biến thể</h3>
                    <p className="text-xs text-muted-foreground">Mỗi dòng là một SKU; có thể thêm nhiều dòng.</p>
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
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} className="font-mono" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
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
    </div>
  );
}
