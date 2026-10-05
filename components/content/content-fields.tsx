import { InlineMessage, SelectInput, TextArea, TextInput } from "@/components/ui/text-input";
import { specFor } from "@/lib/qr/content-types";
import type { ContentType } from "@/lib/qr/types";

interface ContentFieldsProps {
  type: ContentType;
  values: string[];
  /** Why the current content cannot make a code. Null when it is fine or still blank. */
  message: string | null;
  onChange: (index: number, value: string) => void;
}

/**
 * Renders whatever inputs the chosen type asks for, straight from the schema.
 * A single field carries its own message. With several fields the message goes
 * below them, since the problem usually involves the group.
 */
export function ContentFields({ type, values, message, onChange }: ContentFieldsProps) {
  const spec = specFor(type);
  const single = spec.fields.length === 1;

  return (
    <div className="flex flex-col gap-4">
      {spec.fields.map((field, index) => {
        const value = values[index] ?? "";
        const common = {
          label: field.label,
          value,
          message: single ? message : null,
          placeholder: field.placeholder,
          autoComplete: field.autoComplete,
        };
        if (field.options) {
          return (
            <SelectInput
              key={`${type}-${index}`}
              label={field.label}
              value={value}
              onChange={(e) => onChange(index, e.target.value)}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          );
        }
        if (field.multiline) {
          return <TextArea key={`${type}-${index}`} {...common} onChange={(e) => onChange(index, e.target.value)} />;
        }
        return (
          <TextInput
            key={`${type}-${index}`}
            {...common}
            type={field.secret ? "password" : "text"}
            inputMode={field.inputMode}
            spellCheck={false}
            onChange={(e) => onChange(index, e.target.value)}
          />
        );
      })}
      {!single && message && <InlineMessage>{message}</InlineMessage>}
    </div>
  );
}
