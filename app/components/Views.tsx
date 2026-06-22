"use client";
import { useEffect, useState } from "react";

export default function Views({ url }: { url: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/posthog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlToCheck: url }),
        });

        if (!mounted) return;

        if (!res.ok) {
          setViews(0);
          return;
        }

        // Parse JSON safely — fallback to error on invalid JSON
        let data: any;
        try {
          data = await res.json();
        } catch (e) {
          setViews(0);
          return;
        }

        if (data.error) {
          setViews(0);
          return;
        }

        const result = data.results?.find(([u]: [string, number]) => u === url);
        setViews(result ? result[1] : 0);
      } catch (e) {
        setViews(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [url]);

  return (
    <span>
      {views !== null ? views : "..."}
    </span>
  );
}