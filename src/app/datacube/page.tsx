// src/app/datacube/page.tsx
import { Suspense } from "react";
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
