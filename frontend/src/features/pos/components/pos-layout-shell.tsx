import type { PropsWithChildren, ReactNode } from "react";

type PosLayoutShellProps = PropsWithChildren<{
  sessionBar: ReactNode;
  cartPanel: ReactNode;
  catalogPanel: ReactNode;
  paymentPanel: ReactNode;
}>;

export function PosLayoutShell({ sessionBar, cartPanel, catalogPanel, paymentPanel }: PosLayoutShellProps) {
  return (
    <div className="pos-screen min-h-[calc(100dvh-4.25rem)] rounded-xl border border-[hsl(var(--pos-border))] p-3 shadow-sm md:p-4">
      <div className="grid min-h-[calc(100dvh-6rem)] grid-rows-[auto_minmax(0,1fr)] gap-3">
        <section className="min-h-0">{sessionBar}</section>

        <div className="grid min-h-0 gap-3 xl:grid-cols-[1.65fr_1fr] xl:items-stretch">
          <section className="min-h-0">{cartPanel}</section>
          <section className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
            {catalogPanel}
            {paymentPanel}
          </section>
        </div>
      </div>
    </div>
  );
}
