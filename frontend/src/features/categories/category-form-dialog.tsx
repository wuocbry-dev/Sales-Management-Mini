import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createCategory, updateCategory } from "@/api/categories-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import type { CategoryRequest, CategoryResponse } from "@/types/master-data";

const schema = z.object({
  parentId: z.string().optional(),
  categoryCode: z.string().min(1).max(50),
  categoryName: z.string().min(1).max(150),
  description: z.string().max(255).optional(),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues): CategoryRequest {
  const raw = v.parentId?.trim();
  const parentId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  return {
    parentId,
    categoryCode: v.categoryCode.trim(),
    categoryName: v.categoryName.trim(),
    description: v.description?.trim() ? v.description.trim() : null,
    status: v.status,
  };
}

type Props = {
  mode: "create" | "edit";
  category?: CategoryResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (saved?: CategoryResponse) => void;
};

export function CategoryFormDialog({ mode, category, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { parentId: "", categoryCode: "", categoryName: "", description: "", status: "active" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && category) {
      form.reset({
        parentId: category.parentId != null ? String(category.parentId) : "",
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description ?? "",
        status: category.status === "inactive" ? "inactive" : "active",
      });
    } else {
      form.reset({ parentId: "", categoryCode: "", categoryName: "", description: "", status: "active" });
    }
  }, [open, mode, category, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v);
      if (mode === "create") return createCategory(body);
      if (!category) throw new Error("Thiếu nhóm hàng");
      return updateCategory(category.id, body);
    },
    onSuccess: async (saved) => {
      toast.success(mode === "create" ? "Đã tạo nhóm hàng." : "Đã cập nhật nhóm hàng.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["categories"] });
      if (category) await qc.invalidateQueries({ queryKey: ["categories", category.id] });
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
          <DialogTitle>{mode === "create" ? "Thêm nhóm hàng" : "Sửa nhóm hàng"}</DialogTitle>
          <DialogDescription>Mã nhóm cấp trên là tuỳ chọn (để trống nếu không có).</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã nhóm cha (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" placeholder="Để trống nếu không có" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã nhóm hàng</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhóm hàng</FormLabel>
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
