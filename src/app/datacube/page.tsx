// src/app/datacube/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "OKN — Data Cube Explorer",
  description: "Explore gun violence data with pivot tables and charts",
};
import DataCubeApp from "../../components/datacube/DataCubeApp";

export default function DatacubePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[var(--chat-bg)] flex items-center justify-center">
          <span className="text-foreground/50 text-sm">Loading…</span>
        </div>
      }
    >
      <DataCubeApp />
    </Suspense>
  );
}
