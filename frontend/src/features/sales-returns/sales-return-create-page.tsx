import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { createSalesReturnDraft } from "@/api/sales-returns-api";
import { fetchSalesOrderForReturn } from "@/api/sales-orders-api";
import { fetchStoresPage } from "@/api/stores-api";
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
import type { SalesReturnCreateRequestBody } from "@/types/sales-return";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const lineSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().gt(0),
  unitPrice: z.coerce.number().min(0),
  reason: z.string().max(255).optional(),
});

const schema = z.object({
  storeId: z.string().optional(),
  orderLookup: z.string().trim().min(1, "Nhập ID đơn (số) hoặc mã đơn (SO-…)."),
  customerId: z.string().optional(),
  returnDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(lineSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

function needStorePicker(me: MeResponse) {
  return isSystemManage(me) || me.storeIds.length > 1;
}

export function SalesReturnCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pick = Boolean(me && needStorePicker(me));

  const storesQ = useQuery({
    queryKey: ["sr-create", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    enabled: pick,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      orderLookup: "",
      customerId: "",
      returnDate: "",
      note: "",
      lines: [{ orderItemId: 0, variantId: 0, quantity: 0, unitPrice: 0, reason: "" }],
    },
  });

  const orderLookupRaw = form.watch("orderLookup");
  const debouncedOrderLookup = useDebouncedValue(orderLookupRaw, 320);
  const storeIdWatch =
    pick && me
      ? Number(form.watch("storeId"))
      : me && !pick
        ? me.storeIds[0] ?? 0
        : 0;
  const orderQ = useQuery({
    queryKey: ["sales-orders", "for-return", storeIdWatch, debouncedOrderLookup.trim()],
    queryFn: () =>
      fetchSalesOrderForReturn({ storeId: storeIdWatch, lookup: debouncedOrderLookup.trim() }),
    enabled: storeIdWatch > 0 && debouncedOrderLookup.trim().length > 0,
    retry: false,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      if (!me) throw new Error("Chưa đăng nhập");
      const storeId = pick ? Number(v.storeId) : me.storeIds[0];
      if (pick && (!Number.isFinite(storeId) || storeId <= 0)) {
        form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
        throw new Error("validation");
      }
      const ord = orderQ.data;
      if (!ord?.id) {
        form.setError("orderLookup", {
          type: "manual",
          message: "Chưa tải được đơn hàng. Kiểm tra ID/mã đơn và cửa hàng.",
        });
        throw new Error("validation");
      }
      const cu = v.customerId?.trim();
      const body: SalesReturnCreateRequestBody = {
        orderId: ord.id,
        storeId,
        customerId: cu && Number(cu) > 0 ? Number(cu) : null,
        returnDate: datetimeLocalToBackend(v.returnDate),
        note: v.note?.trim() ? v.note.trim() : null,
        lines: v.lines.map((l) => ({
          orderItemId: l.orderItemId,
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          reason: l.reason?.trim() ? l.reason.trim() : null,
        })),
      };
      return createSalesReturnDraft(body);
    },
    onSuccess: async (d) => {
      toast.success("Đã tạo phiếu trả ở trạng thái bản nháp.");
      await qc.invalidateQueries({ queryKey: ["sales-returns"] });
      void navigate(`/app/tra-hang/${d.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  const order = orderQ.data;
  const items = order?.items ?? [];

  const fillFromOrderItem = (lineIndex: number, orderItemId: number) => {
    const it = items.find((i) => i.id === orderItemId);
    if (!it) return;
    form.setValue(`lines.${lineIndex}.variantId`, it.variantId);
    form.setValue(`lines.${lineIndex}.unitPrice`, parseFloat(String(it.unitPrice)));
    const ordered = parseFloat(String(it.quantity));
    form.setValue(
      `lines.${lineIndex}.quantity`,
      Number.isFinite(ordered) && ordered > 0 ? ordered : 0,
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/tra-hang">← Quay lại</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo phiếu trả hàng</CardTitle>
          <CardDescription>
            Chỉ áp dụng cho đơn đã hoàn tất. Mỗi dòng trả theo đúng một dòng đơn: số lượng trả luôn bằng số lượng đặt trên
            dòng đó; đơn giá phải trùng đơn bán. Sau khi lưu bản nháp, mở phiếu và chọn “Xác nhận trả hàng” để cập nhật
            kho.
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
                            {(storesQ.data?.content ?? []).map((s) => (
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
                    Cửa hàng: <span className="font-medium tabular-nums">{me.storeIds[0]}</span>
                  </div>
                ) : null}

                <FormField
                  control={form.control}
                  name="orderLookup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID đơn hoặc mã đơn</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="VD: 12 hoặc SO-20260412-0123"
                          autoComplete="off"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Nhập <span className="font-mono">order_id</span> (số) hoặc mã hiển thị trên đơn (
                        <span className="font-mono">order_code</span>).
                      </p>
                      {orderQ.isFetching ? (
                        <p className="text-xs text-muted-foreground">Đang tải đơn…</p>
                      ) : null}
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
                        <Input {...field} placeholder="Để trống sẽ theo đơn gốc" inputMode="numeric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày giờ trả</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
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

              {orderQ.isError ? (
                <p className="text-sm text-destructive">Không tải được đơn hàng. Kiểm tra mã đơn và quyền xem đơn.</p>
              ) : null}
              {order && order.status !== "completed" ? (
                <p className="text-sm text-amber-700">Đơn này chưa hoàn tất — không thể tạo trả hàng.</p>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Dòng trả</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ orderItemId: 0, variantId: 0, quantity: 0, unitPrice: 0, reason: "" })}
                  >
                    Thêm dòng
                  </Button>
                </div>
                {fields.map((row, i) => (
                  <Card key={row.id} className="border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-sm">Dòng {i + 1}</CardTitle>
                      {fields.length > 1 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                          Xóa
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <FormField
                        control={form.control}
                        name={`lines.${i}.orderItemId`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Dòng trên đơn</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className={selectClass}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const v = raw === "" ? 0 : Number(raw);
                                  field.onChange(v);
                                  if (v) fillFromOrderItem(i, v);
                                  else {
                                    form.setValue(`lines.${i}.variantId`, 0);
                                    form.setValue(`lines.${i}.unitPrice`, 0);
                                    form.setValue(`lines.${i}.quantity`, 0);
                                  }
                                }}
                                disabled={!order || order.status !== "completed"}
                              >
                                <option value="">— Chọn dòng đơn —</option>
                                {items.map((it) => (
                                  <option key={it.id} value={it.id}>
                                    #{it.id} · biến thể {it.variantId} · SL đặt {it.quantity}
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
                        name={`lines.${i}.variantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mã biến thể</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted font-mono" />
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
                            <FormLabel>Đơn giá (theo đơn)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" readOnly className="bg-muted" />
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
                            <FormLabel>Số lượng trả (= SL đặt)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                readOnly
                                className="bg-muted tabular-nums"
                                title="Theo đúng số lượng trên dòng đơn đã chọn"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${i}.reason`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Lý do</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                <Button type="submit" disabled={mutation.isPending || orderQ.isError || order?.status !== "completed"}>
                  {mutation.isPending ? "Đang lưu…" : "Lưu bản nháp"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/tra-hang">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
