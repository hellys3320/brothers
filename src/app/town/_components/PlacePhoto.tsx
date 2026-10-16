"use client";

import { useState } from "react";

interface Photo {
  thumb: string;
  link: string;
}

export default function PlacePhoto({ name, dong }: { name: string; dong: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [broken, setBroken] = useState(false);

  async function load() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (photos) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/places/photo?name=${encodeURIComponent(name)}&dong=${encodeURIComponent(dong)}`);
      const j = (await res.json()) as { ok: boolean; items?: Photo[] };
      setPhotos(j.ok && Array.isArray(j.items) ? j.items : []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={load}
        className="w-full rounded-2xl bg-white px-4 py-2 font-black shadow"
      >
        {open ? "📷 닫기" : "📷 진짜 사진 보기!"}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-stone-100 p-2">
          {loading && <p className="p-3 text-center font-black">🔍 사진 찾는 중...</p>}
          {!loading && (!photos || photos.length === 0) && (
            <p className="p-3 text-center font-bold text-stone-500">사진이 없어! 직접 가서 봐!</p>
          )}
          {!loading && photos && photos.length > 0 && !broken && (
            <a href={photos[0].link} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[0].thumb}
                alt={`${name} 사진`}
                className="max-h-56 w-full rounded-xl object-cover"
                onError={() => setBroken(true)}
              />
            </a>
          )}
          {!loading && photos && photos.length > 0 && broken && (
            <p className="p-3 text-center font-bold text-stone-500">사진이 안 열려! 직접 가서 봐!</p>
          )}
          <p className="p-1 text-center text-xs font-bold text-stone-400">인터넷 사진 참고용 (클릭하면 출처로 이동)</p>
        </div>
      )}
    </div>
  );
}
