import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createUnit, updateUnit } from "@/api/units-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyApiFieldErrors } from "@/lib/apply-field-errors";
import { formatApiError } from "@/lib/api-errors";
import type { UnitRequest, UnitResponse } from "@/types/master-data";

const schema = z.object({
  unitCode: z.string().min(1).max(50),
  unitName: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

function toReq(v: FormValues): UnitRequest {
  return {
    unitCode: v.unitCode.trim(),
    unitName: v.unitName.trim(),
    description: v.description?.trim() ? v.description.trim() : null,
  };
}

type Props = {
  mode: "create" | "edit";
  unit?: UnitResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

export function UnitFormDialog({ mode, unit, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unitCode: "", unitName: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && unit) {
      form.reset({
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        description: unit.description ?? "",
      });
    } else {
      form.reset({ unitCode: "", unitName: "", description: "" });
    }
  }, [open, mode, unit, form]);

  const mutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async (v: FormValues) => {
      const body = toReq(v);
      if (mode === "create") return createUnit(body);
      if (!unit) throw new Error("Thiếu đơn vị");
      return updateUnit(unit.id, body);
    },
    onSuccess: async () => {
      toast.success(mode === "create" ? "Đã tạo đơn vị tính." : "Đã cập nhật đơn vị tính.");
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["units"] });
      if (unit) await qc.invalidateQueries({ queryKey: ["units", unit.id] });
      onSuccess?.();
    },
    onError: (err) => {
      if (!applyApiFieldErrors(err, form.setError, {})) toast.error(formatApiError(err));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm đơn vị tính" : "Sửa đơn vị tính"}</DialogTitle>
          <DialogDescription>Đơn vị dùng cho quy đổi hàng hóa.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <FormField
              control={form.control}
              name="unitCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã đơn vị</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đơn vị</FormLabel>
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
