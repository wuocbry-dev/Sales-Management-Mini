import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createBranch, updateBranchById } from "@/api/branches-api";
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
import type { BranchRequest, BranchResponse } from "@/types/branch";

const schema = z.object({
  branchCode: z.string().min(1, "Bắt buộc").max(50, "Tối đa 50 ký tự"),
  branchName: z.string().min(1, "Bắt buộc").max(255, "Tối đa 255 ký tự"),
  phone: z.string().max(20).optional(),
  email: z.union([z.literal(""), z.string().email("Email không hợp lệ").max(100)]),
  address: z.string().max(255).optional(),
  status: z.enum(["active", "inactive"], { message: "Chọn trạng thái" }),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues): BranchRequest {
  return {
    branchCode: v.branchCode.trim(),
    branchName: v.branchName.trim(),
    phone: v.phone?.trim() ? v.phone.trim() : null,
    email: v.email?.trim() ? v.email.trim() : null,
    address: v.address?.trim() ? v.address.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  storeId: number;
  branch?: BranchResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

export function BranchFormDialog({ mode, storeId, branch, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      branchCode: "",
      branchName: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && branch) {
      form.reset({
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        phone: branch.phone ?? "",
        email: branch.email ?? "",
        address: branch.address ?? "",
        status: branch.status === "inactive" ? "inactive" : "active",
      });
    } else {
      form.reset({
        branchCode: "",
        branchName: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
      });
    }
  }, [open, mode, branch, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v);
      if (mode === "create") return createBranch(storeId, body);
      if (!branch) throw new Error("Thiếu chi nhánh");
      return updateBranchById(branch.branchId, body);
    },
    onSuccess: async () => {
      toast.success(mode === "create" ? "Đã tạo chi nhánh." : "Đã cập nhật chi nhánh.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["branches", storeId] });
      if (branch) await qc.invalidateQueries({ queryKey: ["branches", "detail", branch.branchId] });
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
          <DialogTitle>{mode === "create" ? "Thêm chi nhánh" : "Sửa chi nhánh"}</DialogTitle>
          <DialogDescription>Nhập thông tin theo quy định hệ thống.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
            <FormField
              control={form.control}
              name="branchCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã chi nhánh</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chi nhánh</FormLabel>
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
