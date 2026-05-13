"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { Provider } from "react-redux";

import type { AppStore } from "@/lib/store";
import { makeStore } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const ref = useRef<AppStore | null>(null);
  if (!ref.current) {
    ref.current = makeStore();
  }
  return <Provider store={ref.current}>{children}</Provider>;
}
