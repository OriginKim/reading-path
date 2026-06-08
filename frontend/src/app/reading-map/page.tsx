import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNav from "@/components/layout/AppNav";
import ReadingMapClient from "@/components/reading-map/ReadingMapClient";

export default async function ReadingMapPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">독서 지도</h1>
        <ReadingMapClient />
      </main>
    </>
  );
}
