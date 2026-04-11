import { NavLink, Outlet, useMatches } from "react-router-dom";
import { AccountMenu } from "@/components/layout/account-menu";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { getSidebarSections, type AppNavItem } from "@/app/navigation";
import { useAuthStore } from "@/features/auth/auth-store";
import { cn } from "@/lib/utils";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import type { AppRouteHandle } from "@/routes/app-route-handles";

function NavItemButton({
  item,
  collapsed,
  onNavigate,
}: {
  item: AppNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const base =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(base, isActive ? "bg-primary/15 text-primary hover:text-primary" : "")
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function NavSection({
  title,
  items,
  me,
  collapsed,
  onPick,
}: {
  title: string;
  items: AppNavItem[];
  me: NonNullable<ReturnType<typeof useAuthStore.getState>["me"]>;
  collapsed: boolean;
  onPick?: () => void;
}) {
  const visible = items.filter((i) => i.access(me));
  if (!visible.length) return null;
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      )}
      {visible.map((item) => (
        <NavItemButton key={item.key} item={item} collapsed={collapsed} onNavigate={onPick} />
      ))}
    </div>
  );
}

export function AppShellLayout() {
  const me = useAuthStore((s) => s.me);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const handle = (leaf?.handle ?? {}) as AppRouteHandle;

  if (!me) return null;

  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card shadow-sm transition-all duration-200",
        collapsed ? "w-[72px]" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b px-3",
          collapsed ? "flex-col justify-center gap-1 py-2" : "justify-between gap-2",
        )}
      >
        <NavLink
          to="/app"
          className={cn(
            "truncate text-sm font-bold tracking-tight text-primary",
            collapsed &&
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold",
          )}
          title="Về trang chủ ứng dụng"
        >
          {collapsed ? "BH" : "Bán hàng Pro"}
        </NavLink>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("hidden shrink-0 md:flex", collapsed && "mx-auto")}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        {getSidebarSections(me).map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            me={me}
            collapsed={collapsed}
            onPick={() => setMobileOpen(false)}
          />
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {sidebar}
      <div className={cn("transition-[margin] duration-200", collapsed ? "md:ml-[72px]" : "md:ml-60")}>
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <span className="hidden text-sm font-semibold text-muted-foreground md:inline">Khu vực quản trị</span>
            </div>
            <AccountMenu />
          </div>
          <div className="border-t border-border/60 px-4 py-2">
            <AppBreadcrumbs />
          </div>
        </header>
        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {handle.title ? (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{handle.title}</h1>
                {handle.subtitle ? <p className="text-sm text-muted-foreground">{handle.subtitle}</p> : null}
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
