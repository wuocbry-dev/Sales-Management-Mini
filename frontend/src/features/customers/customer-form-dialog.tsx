import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createCustomer, updateCustomer } from "@/api/customers-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/auth-store";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import type { CustomerRequestBody, CustomerResponse } from "@/types/customer";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const schema = z.object({
  storeId: z.string().optional(),
  customerCode: z.string().min(1, "Bắt buộc").max(50),
  fullName: z.string().min(1, "Bắt buộc").max(150),
  phone: z.string().max(20).optional(),
  email: z
    .string()
    .max(100)
    .refine((s) => {
      const t = s.trim();
      return t === "" || z.string().email().safeParse(t).success;
    }, "Email không hợp lệ"),
  gender: z.enum(["", "MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().optional(),
  address: z.string().max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues, fallbackStoreId: number | null): CustomerRequestBody {
  const sid = v.storeId?.trim();
  const parsed = sid && Number(sid) > 0 ? Number(sid) : null;
  return {
    storeId: parsed ?? fallbackStoreId,
    customerCode: v.customerCode.trim(),
    fullName: v.fullName.trim(),
    phone: v.phone?.trim() ? v.phone.trim() : null,
    email: v.email?.trim() ? v.email.trim() : null,
    gender: v.gender === "" ? null : v.gender,
    dateOfBirth: v.dateOfBirth?.trim() ? v.dateOfBirth.trim() : null,
    address: v.address?.trim() ? v.address.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  customer?: CustomerResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

export function CustomerFormDialog({ mode, customer, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.me);
  const { stores: scopedStores, getStoreName } = useStoreNameMap({ enabled: mode === "create" && open });

  const storeOptions = useMemo(() => {
    if (scopedStores.length > 0) {
      return scopedStores.map((s) => ({ id: s.id, name: s.storeName }));
    }
    return (me?.storeIds ?? []).map((id) => ({ id, name: getStoreName(id) }));
  }, [scopedStores, me?.storeIds, getStoreName]);

  const inferredCreateStoreId = useMemo(() => {
    if (mode !== "create") return null;
    if (me?.defaultStoreId != null && me.defaultStoreId > 0) return me.defaultStoreId;
    if (storeOptions.length === 1) return storeOptions[0].id;
    return null;
  }, [mode, me?.defaultStoreId, storeOptions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      customerCode: "",
      fullName: "",
      phone: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && customer) {
      form.reset({
        storeId: String(customer.storeId),
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        gender: (customer.gender ?? "") as FormValues["gender"],
        dateOfBirth: customer.dateOfBirth ?? "",
        address: customer.address ?? "",
        status: customer.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    } else {
      form.reset({
        storeId: inferredCreateStoreId != null ? String(inferredCreateStoreId) : "",
        customerCode: "",
        fullName: "",
        phone: "",
        email: "",
        gender: "",
        dateOfBirth: "",
        address: "",
        status: "ACTIVE",
      });
    }
  }, [open, mode, customer, form, inferredCreateStoreId]);

  const onSubmit = (v: FormValues) => {
    if (mode === "create") {
      const sid = v.storeId?.trim();
      const selected = sid && Number(sid) > 0 ? Number(sid) : null;
      if (selected == null && inferredCreateStoreId == null) {
        form.setError("storeId", { type: "manual", message: "Vui lòng chọn cửa hàng." });
        return;
      }
    }
    mutation.mutate(v);
  };

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v, mode === "edit" ? (customer?.storeId ?? null) : inferredCreateStoreId);
      if (mode === "create") return createCustomer(body);
      if (!customer) throw new Error("Thiếu khách hàng");
      return updateCustomer(customer.id, body);
    },
    onSuccess: async () => {
      toast.success(mode === "create" ? "Đã tạo khách hàng." : "Đã cập nhật khách hàng.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["customers"] });
      if (customer) await qc.invalidateQueries({ queryKey: ["customers", customer.id] });
      onSuccess?.();
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, form.setError)) toast.error(formatApiError(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm khách hàng" : "Cập nhật khách hàng"}</DialogTitle>
          <DialogDescription>Nhập thông tin theo quy định nghiệp vụ.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "create" ? (
              <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cửa hàng</FormLabel>
                    <FormControl>
                      <select {...field} className={selectClass}>
                        <option value="">— Chọn cửa hàng —</option>
                        {storeOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="customerCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã khách hàng</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điện thoại</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính</FormLabel>
                    <FormControl>
                      <select {...field} className={selectClass}>
                        <option value="">Không khai báo</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Đang lưu…" : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
