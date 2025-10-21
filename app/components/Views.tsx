"use client";
import { useEffect, useState } from "react";

export default function Views({ url }: { url: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/posthog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlToCheck: url }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setViews(0);
          return;
        }
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