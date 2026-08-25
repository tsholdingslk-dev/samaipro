"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatClient from "../ChatClient";

function ChatContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || searchParams.get("id") || "default";

  return <ChatClient projectId={projectId} />;
}

export default function ChatSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading TS-Brain...</div>}>
      <ChatContent />
    </Suspense>
  );
}
