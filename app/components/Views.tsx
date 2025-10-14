"use client";
import { useEffect, useState } from "react";

export default function Views({ url }: { url: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/posthog", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        // Cerca l'URL esatto tra i risultati
        const result = data.results?.find(([u]) => u === url);
        setViews(result ? result[1] : 0);
      });
  }, [url]);

  return (
    <span>
      {views !== null ? views : "..."}
    </span>
  );
}