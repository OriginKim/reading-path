import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNav from "@/components/layout/AppNav";
import BookSearchClient from "@/components/books/BookSearchClient";

export default async function BookSearchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">책 검색</h1>
        <BookSearchClient />
      </main>
    </>
  );
}
