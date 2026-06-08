"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface PathItem {
  title: string;
  connection: string;
}

interface NextPathItem {
  title: string;
  reason: string;
}

interface ReadingMap {
  id: string;
  reader_type: string | null;
  themes: string[];
  keywords: string[];
  current_position: string | null;
  summary: string | null;
  path_json: PathItem[];
  next_path_json: NextPathItem[];
  ai_model: string | null;
  book_count: number | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ReadingMapResult({
  map,
  onRegenerate,
  generating,
  error,
}: {
  map: ReadingMap;
  onRegenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-8">
      {/* 독자 유형 */}
      <div className="text-center py-6 border border-gray-200 rounded-2xl bg-white">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">독자 유형</p>
        <p className="text-2xl font-bold text-gray-900">{map.reader_type}</p>
        {map.current_position && (
          <p className="text-sm text-gray-500 mt-1">{map.current_position}</p>
        )}
      </div>

      {/* 요약 */}
      {map.summary && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
            독서 여정 해석
          </h2>
          <p className="text-gray-700 leading-relaxed">{map.summary}</p>
        </div>
      )}

      {/* 주제 */}
      {map.themes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
            주제 흐름
          </h2>
          <TagList items={map.themes} color="bg-gray-900 text-white" />
        </div>
      )}

      {/* 키워드 */}
      {map.keywords.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
            핵심 키워드
          </h2>
          <TagList items={map.keywords} color="bg-gray-100 text-gray-700" />
        </div>
      )}

      {/* 독서 흐름 */}
      {map.path_json.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
            독서 흐름
          </h2>
          <div className="space-y-3">
            {map.path_json.map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1 border border-gray-200 rounded-xl p-3 bg-white">
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.connection}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다음 경로 */}
      {map.next_path_json.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
            다음 경로
          </h2>
          <div className="space-y-3">
            {map.next_path_json.map((item, i) => (
              <div key={i} className="border border-dashed border-gray-300 rounded-xl p-4 bg-white">
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 정보 + 다시 분석 */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {formatDate(map.created_at)} 분석 · {map.book_count}권 기준
        </p>
        <button
          onClick={onRegenerate}
          disabled={generating}
          className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-40"
        >
          {generating ? "분석 중..." : "다시 분석"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}

export default function ReadingMapClient() {
  const [readingMap, setReadingMap] = useState<ReadingMap | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/reading-maps/latest")
      .then((res) => setReadingMap(res.data))
      .catch(() => {
        // 404(아직 없음) 포함 모든 오류 → 빈 상태로 처리
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post("/reading-maps/generate", {}, { timeout: 60000 });
      setReadingMap(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  if (loadingInitial) {
    return (
      <p className="text-gray-400 text-sm text-center py-16">불러오는 중...</p>
    );
  }

  if (generating) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-700 font-medium">AI가 독서 여정을 분석하고 있습니다</p>
        <p className="text-gray-400 text-sm mt-2">30초 정도 걸릴 수 있습니다</p>
      </div>
    );
  }

  if (readingMap) {
    return (
      <ReadingMapResult
        map={readingMap}
        onRegenerate={handleGenerate}
        generating={generating}
        error={error}
      />
    );
  }

  return (
    <div className="text-center py-16">
      <p className="text-gray-700 font-medium mb-2">아직 독서 지도가 없습니다</p>
      <p className="text-gray-400 text-sm mb-8">
        &apos;다 읽음&apos; 상태 책이 3권 이상 있어야 생성할 수 있습니다.
      </p>
      <button
        onClick={handleGenerate}
        className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        독서 지도 생성
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}
    </div>
  );
}
