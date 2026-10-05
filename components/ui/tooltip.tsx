import { useId, type ReactNode } from "react";

interface TooltipProps {
  text: string;
  /** Receives the id to pass as aria-describedby on the trigger. */
  children: (describedBy: string) => ReactNode;
  className?: string;
}

/**
 * A CSS only tooltip that shows on hover and on keyboard focus. The trigger
 * stays focusable even when it is "disabled" (use aria-disabled), because a
 * truly disabled button cannot be focused and so could never explain itself.
 */
export function Tooltip({ text, children, className = "" }: TooltipProps) {
  const id = useId();
  return (
    <span className={`group/tip relative flex ${className}`}>
      {children(id)}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 w-max max-w-[min(260px,calc(100vw-48px))] rounded-xl bg-ink px-3 py-2 text-left text-[12.5px] font-medium leading-snug text-white opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
