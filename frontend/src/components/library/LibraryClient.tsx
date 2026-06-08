"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface BookDetail {
  external_id: string;
  title: string;
  authors: string[];
  thumbnail_url?: string;
  source: string;
}

interface UserBookItem {
  user_book_id: string;
  book: BookDetail;
  status: string;
  created_at: string;
}

interface LibraryCounts {
  READ: number;
  READING: number;
  WISHLIST: number;
}

const STATUS_LABELS: Record<string, string> = {
  READ: "다 읽음",
  READING: "읽는 중",
  WISHLIST: "읽고 싶어요",
};

const STATUS_COLORS: Record<string, string> = {
  READ: "text-green-700 bg-green-50 border-green-200",
  READING: "text-blue-700 bg-blue-50 border-blue-200",
  WISHLIST: "text-yellow-700 bg-yellow-50 border-yellow-200",
};

const TABS = [
  { key: null, label: "전체" },
  { key: "READ", label: "읽은 책" },
  { key: "READING", label: "읽는 중" },
  { key: "WISHLIST", label: "읽고 싶은" },
] as const;

export default function LibraryClient({ userName }: { userName: string }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [books, setBooks] = useState<UserBookItem[]>([]);
  const [counts, setCounts] = useState<LibraryCounts>({ READ: 0, READING: 0, WISHLIST: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBooks = useCallback(async (status: string | null) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await api.get("/user-books", { params });
      setBooks(res.data.books ?? []);
      setCounts(res.data.counts ?? { READ: 0, READING: 0, WISHLIST: 0 });
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(filter);
  }, [filter, fetchBooks]);

  async function handleStatusChange(userBookId: string, newStatus: string) {
    setUpdating(userBookId);
    try {
      await api.patch(`/user-books/${userBookId}`, { status: newStatus });
      await fetchBooks(filter);
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(userBookId: string) {
    setDeleting(userBookId);
    try {
      await api.delete(`/user-books/${userBookId}`);
      await fetchBooks(filter);
    } finally {
      setDeleting(null);
    }
  }

  const totalCount = counts.READ + counts.READING + counts.WISHLIST;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{userName}님의 서재</h1>
        <p className="text-gray-400 text-sm">
          총 {totalCount}권 · 읽은 책 {counts.READ} · 읽는 중 {counts.READING} · 읽고 싶은 {counts.WISHLIST}
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={String(key)}
            onClick={() => setFilter(key ?? null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === (key ?? null)
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-300 text-gray-700 hover:border-gray-900"
            }`}
          >
            {label}
            {key && <span className="ml-1 text-xs opacity-70">({counts[key as keyof LibraryCounts]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-10">불러오는 중...</p>
      ) : books.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">아직 등록된 책이 없습니다.</p>
          <a href="/books/search" className="text-sm text-gray-900 underline underline-offset-2">
            책 검색해서 추가하기 →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((item) => (
            <div
              key={item.user_book_id}
              className="flex gap-4 border border-gray-200 rounded-xl p-4 bg-white"
            >
              {item.book.thumbnail_url ? (
                <img
                  src={item.book.thumbnail_url}
                  alt={item.book.title}
                  className="w-14 object-cover rounded-md flex-shrink-0"
                  style={{ height: "78px" }}
                />
              ) : (
                <div className="w-14 flex-shrink-0 bg-gray-100 rounded-md" style={{ height: "78px" }} />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">{item.book.title}</h3>
                <p className="text-gray-500 text-xs mb-3">{item.book.authors.join(", ")}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => item.status !== status && handleStatusChange(item.user_book_id, status)}
                      disabled={updating === item.user_book_id}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        item.status === status
                          ? STATUS_COLORS[status]
                          : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700"
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.user_book_id)}
                disabled={deleting === item.user_book_id}
                className="text-gray-300 hover:text-red-400 transition-colors text-lg self-start disabled:opacity-50 ml-2"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
