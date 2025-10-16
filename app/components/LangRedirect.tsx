"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LangRedirect() {
  const router = useRouter();
  useEffect(() => {
    const lang = navigator.language.startsWith("en") ? "en" : "it";
    router.replace(`/blog/${lang}`);
  }, []);
  return null;
}