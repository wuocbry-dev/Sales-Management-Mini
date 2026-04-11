import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserStatusBadge } from "@/components/ui/status-badge";
import { useAuthStore } from "@/features/auth/auth-store";
import { AUTH_ME_QUERY_KEY } from "@/app/auth-query-keys";
import { queryClient } from "@/lib/query-client";
import { describeSessionScope } from "@/lib/session-scope-label";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]!.charAt(0) + p[p.length - 1]!.charAt(0)).toUpperCase();
}

export function AccountMenu({ className }: { className?: string }) {
  const me = useAuthStore((s) => s.me)!;
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const scope = describeSessionScope(me);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-10 gap-2 px-2 sm:px-3", className)}
          aria-label="Menu tài khoản"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initials(me.fullName || me.username)}
          </span>
          <span className="hidden min-w-0 flex-1 flex-col text-left text-xs sm:flex">
            <span className="truncate font-semibold leading-tight text-foreground">{me.fullName}</span>
            <span className="truncate text-muted-foreground">{me.email}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-2 py-1">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="truncate font-semibold text-foreground">{me.fullName}</span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{me.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Trạng thái</span>
              <UserStatusBadge status={me.status} />
            </div>
            {scope ? <p className="text-xs leading-relaxed text-muted-foreground">{scope}</p> : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => {
            clearSession();
            void queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
