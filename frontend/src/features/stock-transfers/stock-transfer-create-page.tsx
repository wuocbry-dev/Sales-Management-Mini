import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchStoresPage } from "@/api/stores-api";
import { createStockTransferDraft } from "@/api/stock-transfers-api";
import { fetchWarehousesForStore } from "@/api/warehouses-api";
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
import type { StockTransferCreateRequestBody } from "@/types/stock-transfer";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const lineSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().gt(0),
});

const schema = z.object({
  storeId: z.string().optional(),
  fromWarehouseId: z.coerce.number().int().positive(),
  toWarehouseId: z.coerce.number().int().positive(),
  transferDate: z.string().min(1),
  note: z.string().max(500).optional(),
  lines: z.array(lineSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

function needStorePicker(me: MeResponse) {
  return isSystemManage(me) || me.storeIds.length > 1;
}

export function StockTransferCreatePage() {
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const pick = Boolean(me && needStorePicker(me));

  const storesQ = useQuery({
    queryKey: ["st-create", "stores"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
    enabled: pick,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      fromWarehouseId: 0,
      toWarehouseId: 0,
      transferDate: "",
      note: "",
      lines: [{ variantId: 0, quantity: 1 }],
    },
  });

  const storeWatch = Number(form.watch("storeId")) || (!pick && me ? me.storeIds[0] : 0);
  const whQ = useQuery({
    queryKey: ["st-create", "wh", storeWatch],
    queryFn: () => fetchWarehousesForStore(storeWatch),
    enabled: storeWatch > 0,
  });
  const whs = whQ.data ?? [];

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const defaultLine = useMemo(() => ({ variantId: 0, quantity: 1 }), []);

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
      if (v.fromWarehouseId === v.toWarehouseId) {
        form.setError("toWarehouseId", { type: "manual", message: "Kho đích phải khác kho nguồn." });
        throw new Error("validation");
      }
      const body: StockTransferCreateRequestBody = {
        fromWarehouseId: v.fromWarehouseId,
        toWarehouseId: v.toWarehouseId,
        transferDate: datetimeLocalToBackend(v.transferDate),
        note: v.note?.trim() ? v.note.trim() : null,
        lines: v.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      };
      return createStockTransferDraft(body);
    },
    onSuccess: (d) => {
      toast.success("Đã tạo phiếu chuyển ở trạng thái bản nháp.");
      void navigate(`/app/chuyen-kho/${d.id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "validation") return;
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/chuyen-kho">← Quay lại</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo phiếu chuyển kho</CardTitle>
          <CardDescription>
            Hai kho phải thuộc cùng một cửa hàng. Sau khi lưu bản nháp, mở phiếu và thực hiện “Xuất kho chuyển”, sau đó bên
            nhận chọn “Nhập kho nhận”.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              {pick ? (
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
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
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  Cửa hàng: <span className="font-medium tabular-nums">{me.storeIds[0]}</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kho nguồn</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className={selectClass}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={!storeWatch}
                        >
                          <option value={0}>— Chọn —</option>
                          {whs.map((w) => (
                            <option key={w.warehouseId} value={w.warehouseId}>
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
                  name="toWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kho đích</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className={selectClass}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={!storeWatch}
                        >
                          <option value={0}>— Chọn —</option>
                          {whs.map((w) => (
                            <option key={w.warehouseId} value={w.warehouseId}>
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
                  name="transferDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày giờ chuyển</FormLabel>
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

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Chi tiết</h3>
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
                          Xóa
                        </Button>
                      ) : null}
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`lines.${i}.variantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mã biến thể</FormLabel>
                            <FormControl>
                              <Input {...field} className="font-mono" inputMode="numeric" />
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Đang lưu…" : "Lưu bản nháp"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/app/chuyen-kho">Huỷ</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
