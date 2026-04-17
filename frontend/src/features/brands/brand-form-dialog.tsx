import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createBrand, updateBrand } from "@/api/brands-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import type { BrandRequest, BrandResponse } from "@/types/master-data";

const schema = z.object({
  brandCode: z.string().min(1, "Bắt buộc").max(50),
  brandName: z.string().min(1, "Bắt buộc").max(150),
  description: z.string().max(255).optional(),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues, storeId?: number): BrandRequest {
  return {
    storeId: typeof storeId === "number" && storeId > 0 ? storeId : undefined,
    brandCode: v.brandCode.trim(),
    brandName: v.brandName.trim(),
    description: v.description?.trim() ? v.description.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  brand?: BrandResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storeId?: number;
  onSuccess?: (saved?: BrandResponse) => void;
};

export function BrandFormDialog({ mode, brand, open, onOpenChange, storeId, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { brandCode: "", brandName: "", description: "", status: "active" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && brand) {
      form.reset({
        brandCode: brand.brandCode,
        brandName: brand.brandName,
        description: brand.description ?? "",
        status: brand.status === "inactive" ? "inactive" : "active",
      });
    } else {
      form.reset({ brandCode: "", brandName: "", description: "", status: "active" });
    }
  }, [open, mode, brand, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v, storeId);
      if (mode === "create") return createBrand(body);
      if (!brand) throw new Error("Thiếu thương hiệu");
      return updateBrand(brand.id, body);
    },
    onSuccess: async (saved) => {
      toast.success(mode === "create" ? "Đã tạo thương hiệu." : "Đã cập nhật thương hiệu.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["brands"] });
      if (brand) await qc.invalidateQueries({ queryKey: ["brands", brand.id] });
      onSuccess?.(saved);
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, form.setError, {})) toast.error(formatApiError(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm thương hiệu" : "Sửa thương hiệu"}</DialogTitle>
          <DialogDescription>Nhập thông tin đúng theo quy định.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <FormField
              control={form.control}
              name="brandCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã thương hiệu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên thương hiệu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
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
