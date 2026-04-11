import { Button } from "@/components/ui/button";
import type { SpringPage } from "@/types/spring-page";

type Props<T> = {
  page: SpringPage<T>;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
};

export function PaginationBar<T>({ page, onPageChange, disabled }: Props<T>) {
  const { number, totalPages, totalElements, size, first, last } = page;
  const from = totalElements === 0 ? 0 : number * size + 1;
  const to = Math.min((number + 1) * size, totalElements);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Hiển thị <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> trong tổng số{" "}
        <span className="font-medium text-foreground">{totalElements}</span> bản ghi
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || first} onClick={() => onPageChange(number - 1)}>
          Trang trước
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          Trang {number + 1} / {Math.max(1, totalPages)}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={disabled || last} onClick={() => onPageChange(number + 1)}>
          Trang sau
        </Button>
      </div>
    </div>
  );
}
