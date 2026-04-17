import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { createGoodsReceiptDraft } from "@/api/goods-receipts-api";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { fetchSuppliersPage } from "@/api/suppliers-api";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isSystemManage } from "@/features/auth/access";
import { gateSupplierMutate } from "@/features/auth/gates";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { useAuthStore } from "@/features/auth/auth-store";
import { SupplierFormDialog } from "@/features/suppliers/supplier-form-dialog";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { datetimeLocalToBackend } from "@/lib/datetime-local-to-backend";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { GoodsReceiptCreateRequestBody } from "@/types/goods-receipt";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const lineSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().gt(0),
  unitCost: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0),
});

const schema = z.object({
  storeId: z.string().optional(),
  warehouseId: z.string().optional(),
  supplierId: z.string().optional(),
  receiptDate: z.string().min(1, "Bắt buộc"),
  headerDiscountAmount: z.coerce.number().min(0),
  note: z.string().max(500).optional(),
  lines: z.array(lineSchema).min(1, "Cần ít nhất một dòng"),
});

type FormValues = z.infer<typeof schema>;

function needStorePicker(me: MeResponse) {
  return isSystemManage(me) || me.storeIds.length > 1;
}

function toBody(v: FormValues, me: MeResponse): GoodsReceiptCreateRequestBody {
  const pickStore = needStorePicker(me);
  const sid = pickStore ? Number(v.storeId) : me.storeIds[0];
  const wh = v.warehouseId?.trim();
  const sup = v.supplierId?.trim();
  return {
    storeId: sid,
    warehouseId: wh && Number(wh) > 0 ? Number(wh) : null,
    supplierId: sup && Number(sup) > 0 ? Number(sup) : null,
    receiptDate: datetimeLocalToBackend(v.receiptDate),
    headerDiscountAmount: v.headerDiscountAmount,
    note: v.note?.trim() ? v.note.trim() : null,
    lines: v.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitCost: l.unitCost,
      discountAmount: l.discountAmount,
    })),
  };
}

export function GoodsReceiptCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const pickStore = Boolean(me && needStorePicker(me));
  const canCreateSupplier = Boolean(me && gateSupplierMutate(me));
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const { stores, getStoreName } = useStoreNameMap();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      warehouseId: "",
      supplierId: "",
      receiptDate: "",
      headerDiscountAmount: 0,
      note: "",
      lines: [{ variantId: 0, quantity: 1, unitCost: 0, discountAmount: 0 }],
    },
  });

  const storeIdWatch = Number(form.watch("storeId")) || (me && !pickStore ? me.storeIds[0] : 0);
  const warehousesQ = useQuery({
    queryKey: ["gr-create", "wh", storeIdWatch],
    queryFn: () => fetchWarehousesForStore(storeIdWatch),
    enabled: storeIdWatch > 0,
  });

  const suppliersQ = useQuery({
    queryKey: ["gr-create", "suppliers"],
    queryFn: () => fetchSuppliersPage({ page: 0, size: 200 }),
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  const defaultLine = useMemo(() => ({ variantId: 0, quantity: 1, unitCost: 0, discountAmount: 0 }), []);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      if (!me) throw new Error("Chưa đăng nhập");
      if (pickStore) {
        const sid = Number(v.storeId);
        if (!Number.isFinite(sid) || sid <= 0) {
          form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
          throw new Error("validation");
        }
      }
      return createGoodsReceiptDraft(toBody(v, me));
    },
    onSuccess: (data) => {
      toast.success("Đã tạo phiếu nhập ở trạng thái bản nháp.");
      void navigate(`/app/phieu-nhap/${data.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const whs = warehousesQ.data ?? [];
  const suppliers = suppliersQ.data?.content ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/phieu-nhap">← Quay lại</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo phiếu nhập</CardTitle>
          <CardDescription>
            Phiếu được lưu ở trạng thái bản nháp. Để cộng tồn kho, mở phiếu và chọn “Xác nhận nhập kho”. Để trống kho nhận
            nghĩa là nhập vào kho tổng của cửa hàng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <div className="grid gap-4 sm:grid-cols-2">
                {pickStore ? (
                  <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Cửa hàng</FormLabel>
                        <FormControl>
                          <select {...field} className={selectClass}>
                            <option value="">— Chọn —</option>
                            {stores.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.storeName}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : me && me.storeIds[0] ? (
                  <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Cửa hàng: </span>
                    <span className="font-medium">{getStoreName(me.storeIds[0])}</span>
                  </div>
                ) : null}

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kho nhận (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass} disabled={!storeIdWatch}>
                          <option value="">Kho tổng cửa hàng (mặc định)</option>
                          {whs.map((w) => (
                            <option key={w.warehouseId} value={String(w.warehouseId)}>
                              {w.warehouseName}
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
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel>Nhà cung cấp (tuỳ chọn)</FormLabel>
                        {canCreateSupplier ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => setSupplierDialogOpen(true)}
                          >
                            Khác
                          </button>
                        ) : null}
                      </div>
                      <FormControl>
                        <select {...field} className={selectClass} disabled={suppliersQ.isPending}>
                          <option value="">— Không chọn —</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.supplierName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {suppliersQ.isError ? (
                        <p className="text-xs text-destructive">Không tải được danh sách nhà cung cấp. Vui lòng tải lại trang.</p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày giờ nhập</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headerDiscountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giảm giá đầu phiếu</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={0} step="0.01" inputMode="decimal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={2}
                          className={cn(
                            "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Chi tiết dòng hàng</h3>
                  <Button type="button" variant="secondary" onClick={() => append(defaultLine)}>
                    Thêm dòng
                  </Button>
                </div>
                {fields.map((row, i) => (
                  <Card key={row.id} className="border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-sm">Dòng {i + 1}</CardTitle>
                      {fields.length > 1 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                          Xóa dòng
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <FormField
                        control={form.control}
                        name={`lines.${i}.variantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biến thể (SKU / tên)</FormLabel>
                            <FormControl>
                              <VariantSearchCombobox
                                key={`${row.id}-${storeIdWatch}`}
                                id={field.name}
                                name={field.name}
                                storeId={storeIdWatch}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                disabled={!storeIdWatch}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${i}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số lượng</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min={0} step="0.001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${i}.unitCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Đơn giá</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min={0} step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${i}.discountAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giảm giá dòng</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min={0} step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Đang lưu…" : "Lưu bản nháp"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/phieu-nhap">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {canCreateSupplier ? (
        <SupplierFormDialog
          mode="create"
          open={supplierDialogOpen}
          onOpenChange={setSupplierDialogOpen}
          onSuccess={(saved) => {
            void suppliersQ.refetch();
            if (saved?.id) {
              form.setValue("supplierId", String(saved.id), { shouldDirty: true, shouldValidate: true });
            }
          }}
        />
      ) : null}
    </div>
  );
}
