import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/library");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          당신의 독서를 하나의 여정으로 보여드립니다
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          읽은 책들 사이의 연결을 AI가 해석하고,
        </p>
        <p className="text-gray-500 text-lg mb-10">
          당신만의 독서 지도를 만들어드립니다.
        </p>

        {/* 예시 독서 지도 목업 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-10 text-left">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
            독서 흐름 예시
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {["데미안", "싯다르타", "이방인"].map((book, i, arr) => (
              <div key={book} className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm">
                  {book}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            자아 탐구형 독자 · 실존 · 자유 · 정체성
          </p>
        </div>

        <Link
          href="/api/auth/signin"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Google로 시작하기
        </Link>
      </section>

      <footer className="absolute bottom-8 text-sm text-gray-400">
        추천이 아닌 연결 · 해석 · 시각화
      </footer>
    </main>
  );
}
