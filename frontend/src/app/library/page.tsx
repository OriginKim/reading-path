import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">
        {session.user?.name}님의 서재
      </h1>
      <p className="text-gray-400 mb-8">Phase 3에서 책 목록이 표시됩니다.</p>
    </main>
  );
}
