import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { getBreeds } from "@/lib/getBreeds";
import { getArticles } from "@/lib/getArticles";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [breeds, articles] = await Promise.all([getBreeds(), getArticles()]);
  return <AppShell breeds={breeds} articles={articles} />;
}
