import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { fetchBranchesForStore } from "@/api/branches-api";
import { createSalesOrderDraft } from "@/api/sales-orders-api";
import { BarcodeScannerInput } from "@/components/catalog/barcode-scanner-input";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { VariantSearchCombobox } from "@/components/catalog/variant-search-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isStoreManagerRole, isSystemManage } from "@/features/auth/access";
import { useAuthStore } from "@/features/auth/auth-store";
import { usePosScopeStore } from "@/features/pos/pos-scope-store";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { datetimeLocalToBackend } from "@/lib/datetime-local-to-backend";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { ProductVariantOptionResponse } from "@/types/product";
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

function nowLocalDateTimeInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toNum(v: number | string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function needStorePicker(me: MeResponse) {
  return isSystemManage(me) || me.storeIds.length > 1;
}

function isPosStaff(me: MeResponse | null): boolean {
  if (!me) return false;
  if (isStoreManagerRole(me) || isSystemManage(me)) return false;
  return me.roles.includes("CASHIER") || me.roles.includes("WAREHOUSE_STAFF");
}

function isPosManager(me: MeResponse | null): boolean {
  if (!me) return false;
  return isStoreManagerRole(me) || isSystemManage(me);
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
  const posStoreId = usePosScopeStore((s) => s.selectedStoreId);
  const posBranchId = usePosScopeStore((s) => s.selectedBranchId);
  const setPosStoreId = usePosScopeStore((s) => s.setSelectedStoreId);
  const setPosBranchId = usePosScopeStore((s) => s.setSelectedBranchId);
  const navigate = useNavigate();
  const pick = Boolean(me && needStorePicker(me));
  const staffLockedBranch = isPosStaff(me) && (me?.branchIds?.length ?? 0) === 1;
  const mustSelectBranch = isPosManager(me);
  const [quickQty, setQuickQty] = useState(1);
  const [quickVariantId, setQuickVariantId] = useState(0);
  const [quickPickerKey, setQuickPickerKey] = useState(0);

  const { stores, getStoreName } = useStoreNameMap();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: posStoreId != null ? String(posStoreId) : "",
      branchId: posBranchId != null ? String(posBranchId) : "",
      customerId: "",
      orderDate: nowLocalDateTimeInput(),
      headerDiscountAmount: 0,
      note: "",
      lines: [],
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

  useEffect(() => {
    if (!me) return;
    if (!pick && me.storeIds.length > 0) {
      form.setValue("storeId", String(me.storeIds[0]), { shouldDirty: false });
    }
    if (staffLockedBranch) {
      form.setValue("branchId", String(me.branchIds[0]), { shouldDirty: false });
    }
  }, [me, pick, staffLockedBranch]);

  useEffect(() => {
    if (storeWatch > 0) {
      setPosStoreId(storeWatch);
      return;
    }
    setPosStoreId(null);
  }, [storeWatch, setPosStoreId]);

  const branchWatchRaw = form.watch("branchId");
  const branchWatch = Number(branchWatchRaw);
  useEffect(() => {
    if (Number.isFinite(branchWatch) && branchWatch > 0) {
      setPosBranchId(branchWatch);
      return;
    }
    setPosBranchId(null);
  }, [branchWatch, setPosBranchId]);

  useEffect(() => {
    setQuickPickerKey((k) => k + 1);
    setQuickVariantId(0);
  }, [storeWatch]);

  const lines = form.watch("lines");
  const headerDiscount = toNum(form.watch("headerDiscountAmount"));

  const subtotal = lines.reduce((sum, l) => {
    const lineTotal = Math.max(0, toNum(l.quantity) * toNum(l.unitPrice) - toNum(l.discountAmount));
    return sum + lineTotal;
  }, 0);
  const total = Math.max(0, subtotal - headerDiscount);

  const addPickedVariant = (picked: ProductVariantOptionResponse, qtyInput: number) => {
    const qty = Math.max(0, Math.floor(qtyInput));
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Số lượng thêm nhanh phải lớn hơn 0.");
      return;
    }

    const current = form.getValues("lines");
    const idx = current.findIndex((l) => Number(l.variantId) === picked.variantId);
    if (idx >= 0) {
      const oldQty = toNum(current[idx]?.quantity);
      form.setValue(`lines.${idx}.quantity`, oldQty + qty, { shouldDirty: true, shouldValidate: true });
    } else {
      const selling = toNum(picked.sellingPrice);
      append({
        variantId: picked.variantId,
        quantity: qty,
        unitPrice: selling,
        discountAmount: 0,
      });
    }

    setQuickQty(1);
    setQuickVariantId(0);
    setQuickPickerKey((k) => k + 1);
  };

  const adjustQty = (index: number, delta: number) => {
    const current = form.getValues(`lines.${index}.quantity`);
    const next = Math.max(1, toNum(current) + delta);
    form.setValue(`lines.${index}.quantity`, next, { shouldDirty: true, shouldValidate: true });
  };

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      if (!me) throw new Error("Chưa đăng nhập");
      if (v.lines.length === 0) {
        form.setError("lines", { type: "manual", message: "Vui lòng thêm ít nhất 1 mặt hàng." });
        throw new Error("validation");
      }
      if (pick) {
        const sid = Number(v.storeId);
        if (!Number.isFinite(sid) || sid <= 0) {
          form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
          throw new Error("validation");
        }
      }
      if (mustSelectBranch) {
        const bid = Number(v.branchId);
        if (!Number.isFinite(bid) || bid <= 0) {
          form.setError("branchId", { type: "manual", message: "Vui lòng chọn chi nhánh để vào POS." });
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

  useEffect(() => {
    const currentBranch = Number(form.getValues("branchId"));
    if (!Number.isFinite(currentBranch) || currentBranch <= 0) return;
    if (branches.some((b) => b.branchId === currentBranch)) return;
    if (staffLockedBranch && me?.branchIds?.[0]) {
      form.setValue("branchId", String(me.branchIds[0]), { shouldDirty: false });
      return;
    }
    form.setValue("branchId", "", { shouldDirty: false });
  }, [branches, form, staffLockedBranch, me]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/don-ban">← Quay lại</Link>
      </Button>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">Bán hàng tại quầy</CardTitle>
                <CardDescription>
                  Chọn nhanh biến thể theo SKU/tên, hệ thống tự cộng dồn số lượng nếu đã có trong giỏ tạm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm sm:col-span-2">
                    <span className="text-muted-foreground">Cửa hàng: </span>
                    <span className="font-medium">{getStoreName(me.storeIds[0])}</span>
                  </div>
                ) : null}

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{mustSelectBranch ? "Chi nhánh" : "Chi nhánh (tuỳ chọn)"}</FormLabel>
                      <FormControl>
                        <select {...field} className={selectClass} disabled={!storeWatch || staffLockedBranch}>
                          <option value="">
                            {mustSelectBranch ? "— Chọn chi nhánh —" : "Không chọn — lấy từ kho tổng cửa hàng"}
                          </option>
                          {branches.map((b) => (
                            <option key={b.branchId} value={String(b.branchId)}>
                              {b.branchName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {staffLockedBranch ? (
                        <p className="text-xs text-muted-foreground">Tài khoản Staff được gắn cố định theo chi nhánh.</p>
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
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
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

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-3 space-y-1">
                    <p className="text-sm font-semibold">Quet barcode</p>
                    <BarcodeScannerInput
                      storeId={storeWatch}
                      disabled={!storeWatch}
                      onFound={(picked) => addPickedVariant(picked, 1)}
                      onNotFound={(msg) => toast.error(msg)}
                    />
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Thêm nhanh sản phẩm</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => append(defaultLine)}>
                      Thêm dòng trống
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div className="sm:col-span-3">
                      <VariantSearchCombobox
                        key={`${quickPickerKey}-${storeWatch}`}
                        apiNamespace="pos"
                        storeId={storeWatch}
                        value={quickVariantId}
                        onChange={setQuickVariantId}
                        onPick={(picked) => addPickedVariant(picked, quickQty)}
                        disabled={!storeWatch}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={quickQty}
                        onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value) || 1))}
                        aria-label="Số lượng thêm nhanh"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <p className="rounded-md border bg-background px-3 py-2 text-center text-sm text-muted-foreground">
                        Enter để chọn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Mặt hàng</TableHead>
                        <TableHead className="w-[16%] text-center">Số lượng</TableHead>
                        <TableHead className="w-[16%] text-right">Đơn giá</TableHead>
                        <TableHead className="w-[16%] text-right">Giảm dòng</TableHead>
                        <TableHead className="w-[12%] text-right">Thành tiền</TableHead>
                        <TableHead className="w-[84px] text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Chưa có mặt hàng nào. Hãy quét/chọn SKU để bắt đầu bán.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((row, i) => {
                          const lineTotal = Math.max(
                            0,
                            toNum(lines[i]?.quantity) * toNum(lines[i]?.unitPrice) - toNum(lines[i]?.discountAmount),
                          );
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${i}.variantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <VariantSearchCombobox
                                key={`${row.id}-${storeWatch}`}
                                apiNamespace="pos"
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
                              </TableCell>
                              <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name={`lines.${i}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center justify-center gap-1">
                                <Button type="button" size="sm" variant="outline" onClick={() => adjustQty(i, -1)}>
                                  -
                                </Button>
                                <Input {...field} type="number" min={0} step="0.001" className="w-20 text-center" />
                                <Button type="button" size="sm" variant="outline" onClick={() => adjustQty(i, 1)}>
                                  +
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                              </TableCell>
                              <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${i}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" min={0} step="0.01" className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                              </TableCell>
                              <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${i}.discountAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="number" min={0} step="0.01" className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatVndFromDecimal(lineTotal)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                                  Xóa
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {form.formState.errors.lines?.message ? (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.lines.message}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Tóm tắt đơn</CardTitle>
                <CardDescription>Giá trị tạm tính theo giỏ hiện tại.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Số dòng hàng</span>
                    <span className="font-medium">{fields.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium tabular-nums">{formatVndFromDecimal(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Giảm đầu đơn</span>
                    <span className="font-medium tabular-nums">{formatVndFromDecimal(headerDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-base">
                    <span className="font-semibold">Khách cần trả</span>
                    <span className="font-semibold tabular-nums">{formatVndFromDecimal(total)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? "Đang lưu…" : "Lưu đơn nháp"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link to="/app/don-ban">Về danh sách đơn bán</Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Đơn được lưu ở trạng thái bản nháp. Sau đó mở chi tiết đơn để xác nhận và ghi nhận thanh toán.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
