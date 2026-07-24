import { AppShell } from "@/components/AppShell";
import { getBreeds } from "@/lib/getBreeds";

export default async function Home() {
  const breeds = await getBreeds();
  return <AppShell breeds={breeds} />;
}
