import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createStore, updateStore } from "@/api/stores-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import type { StoreRequest, StoreResponse } from "@/types/master-data";

const schema = z.object({
  storeCode: z.string().min(1, "Bắt buộc").max(50, "Tối đa 50 ký tự"),
  storeName: z.string().min(1, "Bắt buộc").max(255, "Tối đa 255 ký tự"),
  phone: z.string().max(20).optional(),
  email: z.union([z.literal(""), z.string().email("Email không hợp lệ").max(100)]),
  address: z.string().max(255).optional(),
  status: z.enum(["active", "inactive"], { message: "Chọn trạng thái" }),
});

type FormValues = z.infer<typeof schema>;

function toRequest(v: FormValues): StoreRequest {
  return {
    storeCode: v.storeCode.trim(),
    storeName: v.storeName.trim(),
    phone: v.phone?.trim() ? v.phone.trim() : null,
    email: v.email?.trim() ? v.email.trim() : null,
    address: v.address?.trim() ? v.address.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  store?: StoreResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

export function StoreFormDialog({ mode, store, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeCode: "",
      storeName: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && store) {
      form.reset({
        storeCode: store.storeCode,
        storeName: store.storeName,
        phone: store.phone ?? "",
        email: store.email ?? "",
        address: store.address ?? "",
        status: store.status === "inactive" ? "inactive" : "active",
      });
    } else if (mode === "create") {
      form.reset({
        storeCode: "",
        storeName: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
      });
    }
  }, [open, mode, store, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toRequest(v);
      if (mode === "create") return createStore(body);
      if (!store) throw new Error("Thiếu cửa hàng");
      return updateStore(store.id, body);
    },
    onSuccess: async () => {
      toast.success(mode === "create" ? "Đã tạo cửa hàng." : "Đã cập nhật cửa hàng.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["stores"] });
      onSuccess?.();
    },
    onError: (err) => {
      const applied = applyApiFieldErrors(err, form.setError, {});
      if (!applied) toast.error(formatApiError(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm cửa hàng" : "Sửa cửa hàng"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Nhập thông tin cửa hàng mới." : "Cập nhật thông tin cửa hàng hiện có."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
            <FormField
              control={form.control}
              name="storeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã cửa hàng</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên cửa hàng</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
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
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
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
