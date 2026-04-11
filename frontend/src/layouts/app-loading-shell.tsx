import { Skeleton } from "@/components/ui/skeleton";

export function AppLoadingShell() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center border-b px-4">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </header>
        <div className="flex-1 space-y-4 p-4 md:p-6">
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
