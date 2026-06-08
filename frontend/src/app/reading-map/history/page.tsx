import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ReadingMapHistoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">분석 기록</h1>
      <p className="text-gray-400">MVP 후순위 구현 예정</p>
    </main>
  );
}
