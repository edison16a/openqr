import { Suspense } from "react";
import { Generator } from "@/components/generator/generator";

/**
 * Suspense is required because the generator reads ?edit=<id> from the URL on
 * the client. Without it the whole route would opt out of static rendering.
 */
export default function Home() {
  return (
    <Suspense fallback={null}>
      <Generator />
    </Suspense>
  );
}
