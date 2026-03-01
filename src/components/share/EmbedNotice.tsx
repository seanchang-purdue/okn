"use client";

import { Button } from "@heroui/react";

const EmbedNotice = () => {
  const openFullView = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("embed");
    window.location.assign(url.toString());
  };

  return (
    <div className="border-b border-[var(--chat-border)] bg-white/85 px-3 py-2 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="text-xs text-[var(--chat-muted)]">
          Embedded mode: map-first view with reduced chrome.
        </p>
        <Button size="sm" variant="flat" color="primary" onPress={openFullView}>
          Open full app
        </Button>
      </div>
    </div>
  );
};

export default EmbedNotice;
