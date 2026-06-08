"use client";

import { useState } from "react";
import api from "@/lib/api";

interface BookItem {
  external_id: string;
  title: string;
  authors: string[];
  publisher?: string;
  published_date?: string;
  description?: string;
  thumbnail_url?: string;
  isbn?: string;
  source: string;
}

const STATUS_LABELS: Record<string, string> = {
  READ: "다 읽음",
  READING: "읽는 중",
  WISHLIST: "읽고 싶어요",
};

export default function BookSearchClient() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/books/search", { params: { query: query.trim(), page: 1 } });
      setBooks(res.data.books ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(book: BookItem, status: string) {
    const key = book.external_id;
    setAdding(`${key}:${status}`);
    try {
      await api.post("/user-books", {
        external_id: book.external_id,
        title: book.title,
        authors: book.authors,
        thumbnail_url: book.thumbnail_url ?? null,
        isbn: book.isbn ?? null,
        source: book.source,
        status,
      });
      setAdded((prev) => ({ ...prev, [key]: status }));
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("ALREADY_REGISTERED") || msg.includes("이미 등록")) {
        setAdded((prev) => ({ ...prev, [key]: status }));
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="책 제목, 저자, ISBN 검색"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {books.length === 0 && !loading && query && (
        <p className="text-gray-400 text-sm text-center py-10">검색 결과가 없습니다.</p>
      )}

      <div className="space-y-4">
        {books.map((book) => {
          const addedStatus = added[book.external_id];
          return (
            <div
              key={book.external_id}
              className="flex gap-4 border border-gray-200 rounded-xl p-4 bg-white"
            >
              {book.thumbnail_url ? (
                <img
                  src={book.thumbnail_url}
                  alt={book.title}
                  className="w-16 h-22 object-cover rounded-md flex-shrink-0"
                  style={{ height: "88px" }}
                />
              ) : (
                <div className="w-16 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs" style={{ height: "88px" }}>
                  No cover
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">{book.title}</h3>
                <p className="text-gray-500 text-xs mb-1">{book.authors.join(", ")}</p>
                {book.publisher && (
                  <p className="text-gray-400 text-xs mb-3">{book.publisher}</p>
                )}
                {addedStatus ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    ✓ {STATUS_LABELS[addedStatus]} 추가됨
                  </span>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <button
                        key={status}
                        onClick={() => handleAdd(book, status)}
                        disabled={adding === `${book.external_id}:${status}`}
                        className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 disabled:opacity-50 transition-colors"
                      >
                        {adding === `${book.external_id}:${status}` ? "추가 중..." : label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
