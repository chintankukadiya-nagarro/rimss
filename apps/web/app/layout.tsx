import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RIMSS — YCompany storefront demo",
  description: "Phase 0 scaffold — SSR host + Express API readiness",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
            <span className="text-sm font-semibold tracking-wide text-stone-800">
              YCompany • RIMSS demo
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
