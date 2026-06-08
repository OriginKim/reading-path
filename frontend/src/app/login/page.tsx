import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/library");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Reading Path</h1>
        <p className="text-gray-500 mb-8">독서 여정을 시작하세요</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/library" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 w-full justify-center bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Google 계정으로 로그인
          </button>
        </form>
      </div>
    </main>
  );
}
