"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { myCode, loadFriends, saveFriends, type Friend } from "@/lib/friends";
import { loadMe } from "@/lib/me";
import { speak } from "@/lib/speak";

export default function FriendsClient() {
  const [code] = useState(() => myCode());
  const [friends, setFriends] = useState<Friend[]>(() => loadFriends());
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // 내 코드·이름을 공유 저장소에 등록 (친구가 이름으로 찾을 수 있게)
  useEffect(() => {
    const me = loadMe();
    if (!me || !code) return;
    fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, nickname: me.nickname }),
    }).catch(() => {});
  }, [code]);

  function copy() {
    try {
      void navigator.clipboard?.writeText(code);
      setMsg("코드 복사됐어! 친구에게 알려줘!");
    } catch {
      setMsg(`내 코드: ${code}`);
    }
  }

  async function add() {
    const c = input.trim().toUpperCase();
    if (!c) return;
    if (c === code) {
      setMsg("그건 네 코드야!");
      return;
    }
    if (friends.some((f) => f.code === c)) {
      setMsg("이미 있는 친구야!");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/friends?code=${encodeURIComponent(c)}`);
      const j = (await res.json()) as { ok: boolean; nickname?: string; reason?: string };
      if (j.ok && j.nickname) {
        const next = [...friends, { code: c, nickname: j.nickname, at: Date.now() }];
        setFriends(next);
        saveFriends(next);
        setInput("");
        setMsg(`${j.nickname} 추가됐어!`);
        speak(`${j.nickname} 추가됐어!`);
      } else if (j.reason === "no-store") {
        setMsg("친구 서버가 아직 안 열렸어! (어른에게 부탁해!)");
      } else {
        setMsg("코드를 못 찾았어. 다시 확인해줘!");
      }
    } catch {
      setMsg("인터넷을 확인해줘!");
    } finally {
      setBusy(false);
    }
  }

  function remove(c: string) {
    const next = friends.filter((f) => f.code !== c);
    setFriends(next);
    saveFriends(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-gradient-to-r from-sky-200 to-violet-200 p-6 text-center shadow">
        <p className="font-black text-stone-600">내 친구 코드</p>
        <p className="text-5xl font-black tracking-widest">{code || "..."}</p>
        <button type="button" onClick={copy} className="mt-2 rounded-full bg-white px-6 py-2 font-black shadow">
          📋 코드 복사하기
        </button>
        {msg && <p className="mt-2 font-black">{msg}</p>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">➕ 친구 추가하기</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="친구 코드 6자리"
            maxLength={6}
            className="flex-1 rounded-2xl border-4 border-sky-300 p-3 text-center text-2xl font-black tracking-widest"
          />
          <button type="button" onClick={add} disabled={busy || !input.trim()} className="rounded-2xl bg-sky-400 px-6 py-3 text-xl font-black disabled:opacity-40">
            추가!
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-2xl font-black">👫 내 친구들 ({friends.length}명)</h2>
        {friends.length === 0 ? (
          <p className="mt-2 font-bold text-stone-500">아직 없어. 코드를 주고받아봐!</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {friends.map((f) => (
              <li key={f.code} className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3">
                <div className="flex-1">
                  <p className="text-xl font-black">{f.nickname}</p>
                  <p className="font-bold text-stone-500">{f.code}</p>
                </div>
                <Link href={`/battle?to=${f.code}`} className="rounded-2xl bg-red-300 px-4 py-2 font-black">
                  ⚔️ 대결!
                </Link>
                <button type="button" onClick={() => remove(f.code)} className="rounded-2xl bg-stone-200 px-3 py-2 font-black" aria-label={`${f.nickname} 삭제`}>
                  ✂️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
