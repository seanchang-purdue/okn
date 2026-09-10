"use client";

import { Button } from "@/components/ui/button";

const EmbedNotice = () => {
  const openFullView = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("embed");
    window.location.assign(url.toString());
  };

  return (
    <div className="border-b border-border bg-background/85 px-3 py-2 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Embedded mode: map-first view with reduced chrome.
        </p>
        <Button size="sm" variant="secondary" onClick={openFullView}>
          Open full app
        </Button>
      </div>
    </div>
  );
};

export default EmbedNotice;
