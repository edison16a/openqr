import type { ReactNode } from "react";

/** The white card each job lives in. One card per job, no shadows. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-card bg-surface p-5 sm:p-8 ${className}`}>{children}</section>;
}

/** A titled block inside a card, separated from the one above by a hairline. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-[14px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
