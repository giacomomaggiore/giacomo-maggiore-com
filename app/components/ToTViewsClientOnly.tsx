"use client";
import { useEffect, useState } from "react";
import CumulativeViews from "./TotViews";

export default function TotViewsClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <span>...</span>;

  return <CumulativeViews />;
}