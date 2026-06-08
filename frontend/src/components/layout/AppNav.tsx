"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/library", label: "서재" },
  { href: "/books/search", label: "책 검색" },
  { href: "/reading-map", label: "독서 지도" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/library" className="font-bold text-sm tracking-tight">
          Reading Path
        </Link>
        <div className="flex items-center gap-5">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname.startsWith(href)
                  ? "text-gray-900 font-medium"
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
