"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatMapApp from "../components/core/ChatMapApp";
import EmbedNotice from "../components/share/EmbedNotice";

const HomeContent = () => {
  const searchParams = useSearchParams();
  const isEmbedMode = searchParams.get("embed") === "true";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--chat-bg)] transition duration-200">
      {isEmbedMode && <EmbedNotice />}
      <main className="flex-1 overflow-hidden flex flex-col justify-end">
        <ChatMapApp />
      </main>
    </div>
  );
};

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[var(--chat-bg)]" />}>
      <HomeContent />
    </Suspense>
  );
}
