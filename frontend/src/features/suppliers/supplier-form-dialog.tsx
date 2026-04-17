import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSupplier, updateSupplier } from "@/api/suppliers-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import type { SupplierRequest, SupplierResponse } from "@/types/master-data";

const schema = z.object({
  supplierCode: z.string().min(1).max(50),
  supplierName: z.string().min(1).max(255),
  contactPerson: z.string().max(150).optional(),
  phone: z.string().max(20).optional(),
  email: z.union([z.literal(""), z.string().email("Email không hợp lệ").max(100)]),
  address: z.string().max(255).optional(),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues): SupplierRequest {
  return {
    supplierCode: v.supplierCode.trim(),
    supplierName: v.supplierName.trim(),
    contactPerson: v.contactPerson?.trim() ? v.contactPerson.trim() : null,
    phone: v.phone?.trim() ? v.phone.trim() : null,
    email: v.email?.trim() ? v.email.trim() : null,
    address: v.address?.trim() ? v.address.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  supplier?: SupplierResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (saved?: SupplierResponse) => void;
};

export function SupplierFormDialog({ mode, supplier, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && supplier) {
      form.reset({
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        contactPerson: supplier.contactPerson ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        status: supplier.status === "inactive" ? "inactive" : "active",
      });
    } else {
      form.reset({
        supplierCode: "",
        supplierName: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
      });
    }
  }, [open, mode, supplier, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v);
      if (mode === "create") return createSupplier(body);
      if (!supplier) throw new Error("Thiếu nhà cung cấp");
      return updateSupplier(supplier.id, body);
    },
    onSuccess: async (saved) => {
      toast.success(mode === "create" ? "Đã tạo nhà cung cấp." : "Đã cập nhật nhà cung cấp.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["suppliers"] });
      if (supplier) await qc.invalidateQueries({ queryKey: ["suppliers", supplier.id] });
      onSuccess?.(saved);
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, form.setError, {})) toast.error(formatApiError(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm nhà cung cấp" : "Sửa nhà cung cấp"}</DialogTitle>
          <DialogDescription>Thông tin liên hệ và trạng thái giao dịch.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <FormField
              control={form.control}
              name="supplierCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã nhà cung cấp</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhà cung cấp</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Người liên hệ</FormLabel>
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
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field}>
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngưng hoạt động</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
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
