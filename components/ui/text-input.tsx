import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { WarningIcon } from "./icons";

export const controlClasses =
  "w-full rounded-control border border-control bg-surface px-3.5 text-[15px] text-ink " +
  "placeholder:text-muted/70 transition-colors focus:border-ink disabled:opacity-50";

interface ShellProps {
  label: string;
  id: string;
  /** Inline problem text, shown under the field with a warning icon. */
  message?: string | null;
  children: React.ReactNode;
}

/** Label above, control in the middle, message below. Used by every form field. */
export function FieldShell({ label, id, message, children }: ShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-medium text-muted">
        {label}
      </label>
      {children}
      {message && (
        <p id={`${id}-message`} className="flex items-start gap-1.5 text-[13px] font-medium text-ink">
          <WarningIcon size={15} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; message?: string | null };

export function TextInput({ label, message, className = "", ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} message={message}>
      <input
        id={id}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-message` : undefined}
        className={`${controlClasses} h-11 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function TextArea({ label, message, className = "", ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} message={message}>
      <textarea
        id={id}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-message` : undefined}
        className={`${controlClasses} min-h-28 resize-y py-3 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectInput({
  label,
  message,
  className = "",
  children,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell label={label} id={id} message={message}>
      <select id={id} className={`${controlClasses} h-11 ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
