import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNav from "@/components/layout/AppNav";
import LibraryClient from "@/components/library/LibraryClient";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <LibraryClient userName={session.user?.name ?? "독자"} />
      </main>
    </>
  );
}
