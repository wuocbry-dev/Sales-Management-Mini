/** Tham số phân trang Spring (`page` bắt đầu từ 0). */
export type PageQuery = {
  page: number;
  size: number;
  sort?: string;
};

export function toSpringPageParams(q: PageQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: q.page,
    size: q.size,
  };
  if (q.sort) out.sort = q.sort;
  return out;
}
