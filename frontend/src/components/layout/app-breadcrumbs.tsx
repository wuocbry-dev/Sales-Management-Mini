import { Fragment } from "react";
import { Link, useMatches } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { FORBIDDEN_ROUTE, getPostLoginRedirectPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";
import { cn } from "@/lib/utils";
import type { AppRouteHandle } from "@/routes/app-route-handles";

export function AppBreadcrumbs({ className }: { className?: string }) {
  const matches = useMatches();
  const me = useAuthStore((s) => s.me);
  const home = me ? getPostLoginRedirectPath(me) : null;
  const homeSafe =
    home && home !== FORBIDDEN_ROUTE && home !== "/app/khong-duoc-truy-cap" ? home : null;

  const crumbs = matches
    .filter((m) => m.pathname.startsWith("/app"))
    .map((m) => {
      const h = m.handle as AppRouteHandle | undefined;
      if (!h?.title || h.hideFromBreadcrumb) return null;
      return { pathname: m.pathname, title: h.title };
    })
    .filter((c): c is { pathname: string; title: string } => c !== null);

  if (!crumbs.length) return null;

  return (
    <nav aria-label="Điều hướng dạng vết" className={cn("flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)}>
      {homeSafe ? (
        <>
          <Link
            to={homeSafe}
            className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Bàn làm việc
          </Link>
          {crumbs.length > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden /> : null}
        </>
      ) : null}
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={c.pathname}>
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden /> : null}
            {isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {c.title}
              </span>
            ) : (
              <Link to={c.pathname} className="font-medium transition-colors hover:text-primary">
                {c.title}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
