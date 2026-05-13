import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

import { CartBadge } from "@/components/CartBadge";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "RIMSS — YCompany storefront demo",
  description: "RIMSS demo — SSR storefront, catalogue, and server cart",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Providers>
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-semibold tracking-wide text-stone-800">
                YCompany • RIMSS demo
              </span>
              <nav className="flex items-center gap-4 text-sm">
                <Link className="text-stone-600 hover:text-stone-900" href="/products">
                  Catalogue
                </Link>
                <Link
                  className="text-stone-600 hover:text-stone-900"
                  href="/cart"
                >
                  Cart
                  <CartBadge />
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
