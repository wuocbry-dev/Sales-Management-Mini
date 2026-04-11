import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#gia-tri", label: "Giá trị" },
  { href: "/#linh-vuc", label: "Lĩnh vực" },
  { href: "/#cong-cu", label: "Công cụ" },
  { href: "/#tinh-nang", label: "Tính năng" },
  { href: "/#chuoi-cua-hang", label: "Chuỗi & kho" },
  { href: "/#phan-hoi", label: "Phản hồi" },
];

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="text-lg font-bold tracking-tight text-primary">
            Bán hàng Pro
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Button key={l.href} variant="ghost" size="sm" asChild>
                <a href={l.href}>{l.label}</a>
              </Button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Đăng nhập</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
