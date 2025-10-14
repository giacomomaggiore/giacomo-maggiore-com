"use client";
import { useEffect, useState } from "react";
import Views from "./Views";

export default function ViewsClientOnly({ url }: { url: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Non renderizzare nulla lato server

  return <Views url={url} />;
}