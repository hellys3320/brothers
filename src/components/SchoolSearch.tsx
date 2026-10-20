"use client";

import { useState } from "react";
import { searchSchools, type SchoolInfo } from "@/lib/school";
import { speak } from "@/lib/speak";

export default function SchoolSearch({
  onSelect,
  autoFocus = false,
}: {
  onSelect: (school: SchoolInfo) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SchoolInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!q.trim() || busy) return;
    setBusy(true);
    setSearched(true);
    try {
      const result = await searchSchools(q);
      setItems(result);
      if (result.length === 0) speak("못 찾았어. 학교 이름을 더 정확히 써봐!");
    } catch {
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="예: 서울염창초등학교"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 rounded-2xl border-4 border-sky-300 p-3 text-xl font-black"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !q.trim()}
          className="rounded-2xl bg-sky-400 px-6 py-3 text-xl font-black disabled:opacity-40"
        >
          {busy ? "..." : "찾기"}
        </button>
      </div>
      <p className="mt-1 text-sm font-bold text-stone-500">
        학교 이름을 2글자 이상 넣어봐. 초등학교를 먼저 찾아줄게!
      </p>

      {searched && !busy && items.length === 0 && (
        <p className="mt-3 rounded-2xl bg-stone-100 p-3 text-center font-bold text-stone-500">
          못 찾았어. 학교 이름을 조금 더 길게 써보자.
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 text-left">
          {items.map((school) => (
            <li key={`${school.officeCode}-${school.schoolCode}`}>
              <button
                type="button"
                onClick={() => onSelect(school)}
                className="w-full rounded-2xl bg-sky-50 px-4 py-3 text-left hover:bg-sky-100"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-black">🏫 {school.name}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-sky-700">
                    {school.kind || "학교"}
                  </span>
                </span>
                <span className="mt-1 block text-sm font-bold text-stone-500">
                  {school.officeName}
                  {school.address ? ` · ${school.address}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
