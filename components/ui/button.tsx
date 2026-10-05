import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-[14px] font-semibold " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-black active:bg-black/80",
  secondary: "border border-control bg-surface text-ink hover:bg-ground active:bg-line",
  quiet: "text-muted hover:text-ink hover:bg-ground px-3",
};

/** Class names shared by real buttons and link styled buttons. */
export function buttonClasses(variant: ButtonVariant = "secondary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

/** A real button. Defaults to type="button" so it never submits a form by accident. */
export function Button({ variant, icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  /** Use a plain anchor for off site links so Next does not try to prefetch them. */
  external?: boolean;
};

/** A link that looks like a button. Internal links use next/link. */
export function ButtonLink({ variant, icon, external, className, children, href, ...props }: LinkProps) {
  const classes = buttonClasses(variant, className);
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {icon}
      {children}
    </Link>
  );
}
