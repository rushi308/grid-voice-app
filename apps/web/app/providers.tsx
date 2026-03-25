"use client";

import type { ReactNode } from "react";
import { AppProviders } from "@/providers/AppProviders";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return <AppProviders>{children}</AppProviders>;
}
