import type { PropsWithChildren, ReactNode } from "react";

type PosLayoutShellProps = PropsWithChildren<{
  sessionBar: ReactNode;
  cartPanel: ReactNode;
  catalogPanel: ReactNode;
  paymentPanel: ReactNode;
}>;

export function PosLayoutShell({ sessionBar, cartPanel, catalogPanel, paymentPanel }: PosLayoutShellProps) {
  return (
    <div className="pos-screen min-h-[calc(100dvh-4rem)] rounded-xl border border-[hsl(var(--pos-border))] p-3 md:p-4">
      <div className="mb-3">{sessionBar}</div>
      <div className="grid gap-3 lg:grid-cols-[1.8fr_1fr] lg:items-stretch">
        <section className="min-h-[58dvh] lg:min-h-[62dvh]">{cartPanel}</section>
        <section className="grid min-h-[58dvh] gap-3 lg:min-h-[62dvh] lg:grid-rows-[minmax(0,1fr)_auto]">
          {catalogPanel}
          {paymentPanel}
        </section>
      </div>
    </div>
  );
}
