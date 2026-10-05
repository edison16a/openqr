"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface ToastOptions {
  message: string;
  /** Optional button, used for "Undo". */
  actionLabel?: string;
  onAction?: () => void;
  /** Milliseconds before it hides. Defaults to 3 seconds. */
  duration?: number;
}

type ShowToast = (options: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Returns a function that shows a toast. Safe to call from effects and handlers. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

/**
 * Holds one toast at a time at the bottom of the screen. The wrapper is a
 * polite live region, so screen readers hear "Copied" without being interrupted.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setCurrent(null);
  }, []);

  const show = useCallback<ShowToast>(
    (options) => {
      clearTimeout(timer.current);
      setCurrent(options);
      timer.current = setTimeout(() => setCurrent(null), options.duration ?? 3000);
    },
    [],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {current && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-ink py-2.5 pl-5 pr-3 text-[14px] font-medium text-white shadow-lg">
            <span>{current.message}</span>
            {current.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  current.onAction?.();
                  dismiss();
                }}
                className="min-h-9 rounded-full px-3 font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-white"
              >
                {current.actionLabel}
              </button>
            )}
            {!current.actionLabel && <span className="w-2" aria-hidden="true" />}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
