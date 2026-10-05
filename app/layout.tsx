import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/ui/toast";
import { SITE } from "@/lib/config";
import "./globals.css";

// Self hosted by next/font at build time, so no request goes to Google at runtime.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s, ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = { themeColor: "#F5F5F2" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={instrument.variable}>
      <body>
        <ToastProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-[1296px] flex-col px-4 pb-8 sm:px-8 min-[1088px]:px-12">
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
