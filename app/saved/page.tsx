import type { Metadata } from "next";
import { SavedCodes } from "@/components/saved/saved-codes";

export const metadata: Metadata = { title: "Saved codes" };

export default function SavedPage() {
  return <SavedCodes />;
}
