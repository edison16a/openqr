"use client";

import { CenterPicker } from "@/components/center/center-picker";
import { ColorPickers } from "@/components/colors/color-pickers";
import { ContentFields } from "@/components/content/content-fields";
import { ContentTabs } from "@/components/content/content-tabs";
import { ExportActions } from "@/components/export/export-actions";
import { QrPreview } from "@/components/qr/qr-preview";
import { Card, Section } from "@/components/ui/card";
import { useGenerator } from "@/hooks/use-generator";

/**
 * The whole generator screen: live code on the left, three short sections on
 * the right. Below 1088px the cards stack with the code first.
 */
export function Generator() {
  const { state, derived, dispatch } = useGenerator();
  const message = derived.status === "invalid" ? derived.message : null;

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 min-[1088px]:grid-cols-2 min-[1088px]:gap-8">
      <Card className="flex flex-col items-center gap-8">
        <div className="flex w-full flex-1 items-center justify-center py-2">
          <QrPreview state={state} derived={derived} />
        </div>
        <ExportActions derived={derived} fg={state.fg} bg={state.bg} />
      </Card>

      <Card className="flex flex-col gap-7">
        <Section title="Content">
          <ContentTabs value={state.type} onChange={(value) => dispatch({ type: "set-type", value })} />
          <ContentFields
            type={state.type}
            values={state.fieldsByType[state.type]}
            message={message}
            onChange={(index, value) => dispatch({ type: "set-field", index, value })}
          />
        </Section>
        <Section title="Center image">
          <CenterPicker state={state} dispatch={dispatch} />
        </Section>
        <Section title="Colors">
          <ColorPickers
            fg={state.fg}
            bg={state.bg}
            onFg={(value) => dispatch({ type: "set-fg", value })}
            onBg={(value) => dispatch({ type: "set-bg", value })}
          />
        </Section>
      </Card>
    </div>
  );
}
