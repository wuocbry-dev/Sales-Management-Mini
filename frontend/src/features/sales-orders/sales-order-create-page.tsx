import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBranchesForStore } from "@/api/branches-api";
import { createSalesOrderDraft } from "@/api/sales-orders-api";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { datetimeLocalToBackend } from "@/lib/datetime-local-to-backend";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { SalesOrderCreateRequestBody } from "@/types/sales-order";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const lineSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().gt(0),
  unitPrice: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0),
});

const schema = z.object({
  storeId: z.string().optional(),
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  orderDate: z.string().min(1, "Bắt buộc"),
  headerDiscountAmount: z.coerce.number().min(0),
  note: z.string().max(500).optional(),
  lines: z.array(lineSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

function needStorePicker(me: MeResponse) {
  return isSystemManage(me) || me.storeIds.length > 1;
}

function toBody(v: FormValues, me: MeResponse): SalesOrderCreateRequestBody {
  const pick = needStorePicker(me);
  const storeId = pick ? Number(v.storeId) : me.storeIds[0];
  const br = v.branchId?.trim();
  const cu = v.customerId?.trim();
  return {
    storeId,
    branchId: br && Number(br) > 0 ? Number(br) : null,
    customerId: cu && Number(cu) > 0 ? Number(cu) : null,
    orderDate: datetimeLocalToBackend(v.orderDate),
    headerDiscountAmount: v.headerDiscountAmount,
    note: v.note?.trim() ? v.note.trim() : null,
    lines: v.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountAmount: l.discountAmount,
    })),
  };
}

export function SalesOrderCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const pick = Boolean(me && needStorePicker(me));

  const { stores, getStoreName } = useStoreNameMap();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      branchId: "",
      customerId: "",
      orderDate: "",
      headerDiscountAmount: 0,
      note: "",
      lines: [{ variantId: 0, quantity: 1, unitPrice: 0, discountAmount: 0 }],
    },
  });

  const storeWatch = Number(form.watch("storeId")) || (!pick && me ? me.storeIds[0] : 0);
  const branchesQ = useQuery({
    queryKey: ["so-create", "branches", storeWatch],
    queryFn: () => fetchBranchesForStore(storeWatch, { page: 0, size: 200 }),
    enabled: storeWatch > 0,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const defaultLine = useMemo(() => ({ variantId: 0, quantity: 1, unitPrice: 0, discountAmount: 0 }), []);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      if (!me) throw new Error("Chưa đăng nhập");
      if (pick) {
        const sid = Number(v.storeId);
        if (!Number.isFinite(sid) || sid <= 0) {
          form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
          throw new Error("validation");
        }
      }
      return createSalesOrderDraft(toBody(v, me));
    },
    onSuccess: (d) => {
      toast.success("Đã tạo đơn ở trạng thái bản nháp.");
      void navigate(`/app/don-ban/${d.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const branches = branchesQ.data?.content ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/don-ban">← Quay lại</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo đơn hàng</CardTitle>
          <CardDescription>
            Đơn lưu ở trạng thái bản nháp. Khi không chọn chi nhánh, hệ thống lấy hàng từ kho tổng của cửa hàng. Khi chọn
            chi nhánh, hàng lấy từ kho của chi nhánh đó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <div className="grid gap-4 sm:grid-cols-2">
                {pick ? (
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
                ) : me?.storeIds[0] ? (
                  <div className="sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Cửa hàng: </span>
                    <span className="font-medium">{getStoreName(me.storeIds[0])}</span>
                  </div>
                ) : null}

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi nhánh (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass} disabled={!storeWatch}>
                          <option value="">Không chọn — lấy từ kho tổng cửa hàng</option>
                          {branches.map((b) => (
                            <option key={b.branchId} value={String(b.branchId)}>
                              {b.branchName}
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
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Khách hàng (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="numeric" placeholder="Mã khách hàng" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày giờ đặt</FormLabel>
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
                      <FormLabel>Giảm giá đầu đơn</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={0} step="0.01" />
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
                  <h3 className="text-sm font-semibold">Chi tiết mặt hàng</h3>
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
                          <FormItem className="sm:col-span-2 lg:col-span-2">
                            <FormLabel>Biến thể (SKU / tên)</FormLabel>
                            <FormControl>
                              <VariantSearchCombobox
                                key={`${row.id}-${storeWatch}`}
                                id={field.name}
                                name={field.name}
                                storeId={storeWatch}
                                value={field.value}
                                onChange={field.onChange}
                                onPick={(picked) => {
                                  const sp = Number(picked.sellingPrice);
                                  form.setValue(`lines.${i}.unitPrice`, Number.isFinite(sp) ? sp : 0);
                                  form.setValue(`lines.${i}.discountAmount`, 0);
                                }}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                disabled={!storeWatch}
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
                        name={`lines.${i}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Đơn giá bán</FormLabel>
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
                  <Link to="/app/don-ban">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
