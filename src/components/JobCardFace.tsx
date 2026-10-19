// 직업 카드 앞면 (수집함·배틀 공용) — 트레이딩 카드 느낌 + 보물 소켓
import type { JobCard } from "@/lib/mock";
import { TREASURE_STYLE, type Treasure } from "@/lib/treasures";

const STATS = ["힘", "말하기", "그리기", "관찰", "손재주"] as const;
const POWER_EMOJI: Record<string, string> = { 힘: "💪", 말하기: "🗣️", 그리기: "🎨", 관찰: "🔍", 손재주: "✋" };

const FIELD_BG: Record<string, string> = {
  먹거리: "from-orange-200 to-amber-100",
  돌봄: "from-rose-200 to-sky-100",
  안전: "from-red-200 to-orange-100",
  배움: "from-sky-200 to-indigo-100",
  예술: "from-pink-200 to-violet-200",
  기술: "from-slate-200 to-cyan-100",
  자연: "from-green-200 to-lime-100",
  움직임: "from-violet-200 to-blue-100",
};

const RARITY_FRAME: Record<string, string> = {
  커먼: "from-stone-300 via-stone-200 to-stone-400",
  레어: "from-sky-400 via-cyan-300 to-blue-500",
  레전드: "from-amber-300 via-yellow-200 to-orange-400",
};

const RARITY_BADGE: Record<string, string> = {
  커먼: "bg-stone-200 text-stone-600",
  레어: "bg-sky-200 text-sky-800",
  레전드: "bg-amber-200 text-amber-800",
};

export default function JobCardFace({
  job,
  no,
  socket = null,
  onSocketClick,
  className = "",
}: {
  job: JobCard;
  no?: string;
  socket?: Treasure | null;
  onSocketClick?: () => void;
  className?: string;
}) {
  const powers = job.powers as unknown as Record<string, number>;
  const total = STATS.reduce((s, k) => s + (powers[k] ?? 0), 0) + (socket?.bonus ?? 0);
  const boostStat = socket?.stat ?? null;
  const shiny = job.rarity !== "커먼";

  return (
    <div
      className={`group relative aspect-[5/7] w-full rounded-2xl bg-gradient-to-br p-[3px] shadow-lg transition-transform duration-200 hover:-translate-y-1 ${RARITY_FRAME[job.rarity]} ${className}`}
    >
      {/* 반짝 홀로그램 (레어·레전드) */}
      {shiny && (
        <span
          aria-hidden
          className="animate-floaty pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/60 to-transparent opacity-70"
        />
      )}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[13px] bg-[#fdf7e6] p-1.5">
        {/* 머리: 이름 + HP(총 능력치) */}
        <div className="flex items-center gap-1">
          <span className="truncate text-[13px] font-black leading-tight">{job.name}</span>
          <span className="ml-auto shrink-0 text-[9px] font-black text-stone-400">HP</span>
          <span className="shrink-0 rounded bg-red-500 px-1 text-[12px] font-black leading-tight text-white">{total}</span>
        </div>

        {/* 그림 */}
        <div className={`relative mt-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${FIELD_BG[job.field] ?? "from-stone-100 to-stone-200"}`}>
          <span className="absolute left-1 top-1 rounded-full bg-white/85 px-1.5 text-[9px] font-black text-stone-600">{job.field}</span>
          {socket && (
            <span className="absolute right-1 top-1 rounded-full bg-white/85 px-1.5 text-[9px] font-black text-amber-700">💠강화</span>
          )}
          <span className="text-4xl drop-shadow sm:text-5xl">{job.emoji}</span>
        </div>

        {/* 능력치 */}
        <div className="mt-1 flex flex-col gap-[2px]">
          {STATS.map((k) => {
            const base = powers[k] ?? 0;
            const boosted = boostStat === k;
            const shown = base + (boosted ? (socket?.bonus ?? 0) : 0);
            return (
              <div key={k} className={`flex items-center gap-1 rounded px-1 ${boosted ? "bg-amber-200" : ""}`}>
                <span className="text-[10px] leading-none">{POWER_EMOJI[k]}</span>
                <span className="w-7 shrink-0 text-[9px] font-black leading-none text-stone-500">{k}</span>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-200">
                  <span
                    className={`block h-full rounded-full ${boosted ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-sky-400 to-emerald-400"}`}
                    style={{ width: `${Math.min(100, (shown / 8) * 100)}%` }}
                  />
                </span>
                <span className={`w-8 shrink-0 text-right text-[11px] font-black leading-none ${boosted ? "text-amber-700" : ""}`}>
                  {boosted ? "▲" : ""}
                  {shown}
                </span>
              </div>
            );
          })}
        </div>

        {/* 소켓 */}
        {onSocketClick ? (
          <button
            type="button"
            onClick={onSocketClick}
            className={`mt-1 w-full rounded-lg px-1 py-1 text-[10px] font-black ${
              socket ? `bg-gradient-to-r ${TREASURE_STYLE[socket.rarity].bg} text-amber-900` : "border-2 border-dashed border-stone-300 text-stone-500 hover:bg-stone-50"
            }`}
          >
            {socket ? `${socket.emoji} ${socket.name} · ${socket.stat}+${socket.bonus}` : "＋ 보물 꽂기"}
          </button>
        ) : (
          <div
            className={`mt-1 w-full truncate rounded-lg px-1 py-1 text-center text-[10px] font-black ${
              socket ? `bg-gradient-to-r ${TREASURE_STYLE[socket.rarity].bg} text-amber-900` : "border-2 border-dashed border-stone-200 text-stone-400"
            }`}
          >
            {socket ? `${socket.emoji} ${socket.name} · ${socket.stat}+${socket.bonus}` : "빈 소켓"}
          </div>
        )}

        {/* 바닥: 번호 + 희귀도 */}
        <div className="mt-1 flex items-center justify-between px-0.5">
          <span className="text-[9px] font-black text-stone-400">No.{no ?? "???"}</span>
          <span className={`rounded-full px-1.5 text-[9px] font-black ${RARITY_BADGE[job.rarity]}`}>{job.rarity}</span>
        </div>
      </div>
    </div>
  );
}
