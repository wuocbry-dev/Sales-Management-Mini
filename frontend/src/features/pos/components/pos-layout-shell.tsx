import type { PropsWithChildren, ReactNode } from "react";

type PosLayoutShellProps = PropsWithChildren<{
  sessionBar: ReactNode;
  cartPanel: ReactNode;
  catalogPanel: ReactNode;
  paymentPanel: ReactNode;
}>;

export function PosLayoutShell({ sessionBar, cartPanel, catalogPanel, paymentPanel }: PosLayoutShellProps) {
  return (
    <div className="pos-screen h-[calc(100dvh-10.5rem)] overflow-hidden rounded-xl border border-[hsl(var(--pos-border))] p-3 md:h-[calc(100dvh-11.5rem)] md:p-4">
      <div className="mb-3 shrink-0">{sessionBar}</div>
      <div className="grid min-h-0 h-[calc(100%-5.25rem)] gap-3 lg:grid-cols-[1.8fr_1fr] lg:items-stretch">
        <section className="min-h-0">{cartPanel}</section>
        <section className="grid min-h-0 gap-3 lg:grid-rows-[minmax(0,1fr)_auto]">
          {catalogPanel}
          {paymentPanel}
        </section>
      </div>
    </div>
  );
}
