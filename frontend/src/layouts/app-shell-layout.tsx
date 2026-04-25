import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useLocation, useMatches } from "react-router-dom";
import { fetchBranchById } from "@/api/branches-api";
import { AccountMenu } from "@/components/layout/account-menu";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { getSidebarSections, type AppNavItem } from "@/app/navigation";
import { useAuthStore } from "@/features/auth/auth-store";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { isSystemLevelUser } from "@/lib/access-control";
import { AppLoadingShell } from "@/layouts/app-loading-shell";
import { roleCodeDescriptionVi } from "@/lib/role-labels";
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
  const base = cn(
    "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
    collapsed ? "justify-center px-0" : "gap-3 px-3",
  );

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
  const currentStoreId = me?.defaultStoreId ?? (me?.storeIds?.length ? me.storeIds[0] : null);
  const { getStoreName } = useStoreNameMap({ enabled: Boolean(currentStoreId) });
  const matches = useMatches();
  const location = useLocation();
  const leaf = matches[matches.length - 1];
  const handle = (leaf?.handle ?? {}) as AppRouteHandle;
  const isPosRoute = Boolean(leaf?.pathname?.startsWith("/app/pos"));
  const isAiAgentRoute = location.pathname.startsWith("/app/ai-agent");
  const fullBleed = Boolean(handle.fullBleed || isAiAgentRoute);

  if (!me) return <AppLoadingShell />;

  const currentStoreLabel = currentStoreId ? getStoreName(currentStoreId) : "Chưa chọn cửa hàng";
  const isAdmin = isSystemLevelUser(me);
  const isCashier = me.roles.includes("CASHIER");
  const isWarehouseStaff = me.roles.includes("WAREHOUSE_STAFF");
  const isFrontlineRole = isCashier || isWarehouseStaff;
  const currentBranchId = me.branchIds.length > 0 ? me.branchIds[0] : null;
  const branchQ = useQuery({
    queryKey: ["layout", "branch", currentBranchId],
    queryFn: () => fetchBranchById(Number(currentBranchId)),
    enabled: isFrontlineRole && currentBranchId != null,
    staleTime: 60_000,
    retry: false,
  });
  const isStoreManager = me.roles.includes("STORE_MANAGER");
  const frontlineRoleCode = isCashier ? "CASHIER" : isWarehouseStaff ? "WAREHOUSE_STAFF" : null;
  const roleHeadline = isAdmin
    ? "ADMIN"
    : frontlineRoleCode
      ? roleCodeDescriptionVi(frontlineRoleCode)
      : isStoreManager
        ? "Quản lý cửa hàng"
        : "Người dùng";
  const currentBranchName =
    currentBranchId == null
      ? null
      : branchQ.data?.branchName ?? `Chi nhánh #${currentBranchId}`;
  const roleSubline = isAdmin
    ? "quản trị viên hệ thống"
    : frontlineRoleCode
      ? (currentBranchName ?? (branchQ.isPending ? "Đang tải chi nhánh..." : "Chưa gán chi nhánh"))
      : currentStoreLabel;

  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r bg-card shadow-sm transition-all duration-200",
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
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary",
          )}
          title={collapsed ? currentStoreLabel : "Về trang chủ ứng dụng"}
        >
          BH
        </NavLink>
        {!collapsed ? (
          <div className="min-w-0 flex-1 px-2">
            <p
              className="truncate text-xs font-bold tracking-wide text-emerald-700 dark:text-emerald-400"
              title={roleHeadline}
            >
              {roleHeadline}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground" title={roleSubline}>
              {roleSubline}
            </p>
          </div>
        ) : null}
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
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-6 p-3",
          collapsed
            ? "overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "overflow-y-auto",
        )}
      >
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

  if (isPosRoute) {
    return (
      <div className="h-dvh w-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className={cn("bg-muted/30", fullBleed ? "h-dvh overflow-hidden" : "min-h-screen")}>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {sidebar}
      <div
        className={cn(
          "transition-[margin] duration-200",
          fullBleed && "flex h-dvh flex-col overflow-hidden",
          collapsed ? "md:ml-[72px]" : "md:ml-60",
        )}
      >
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
        <main className={cn(fullBleed ? "min-h-0 flex-1 overflow-hidden p-0" : "p-4 md:p-6")}>
          <div className={cn(fullBleed ? "h-full min-h-0 w-full overflow-hidden" : "mx-auto max-w-7xl space-y-6")}>
            {handle.title && !fullBleed ? (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{handle.title}</h1>
                {handle.subtitle ? <p className="text-sm text-muted-foreground">{handle.subtitle}</p> : null}
              </div>
            ) : null}
            <div className={cn(fullBleed && "h-full min-h-0 overflow-hidden")}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
