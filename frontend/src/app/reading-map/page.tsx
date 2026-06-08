import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function ReadingMapPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">독서 지도</h1>
      <p className="text-gray-400">Phase 4-5에서 AI 분석 결과가 표시됩니다.</p>
    </main>
  );
}
