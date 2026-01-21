"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScenarioSelectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat/scenario-select/topic-suggestion");
  }, [router]);

  return null;
}
