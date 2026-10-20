// 학교 검색 프록시 (NEIS 학교기본정보)
// 인증키: NEIS_API_KEY (open.neis.go.kr에서 발급). 없으면 샘플 조회로 시도한다.
import { neisRows, toSchool, type NeisSchoolRow } from "@/lib/neis";
import type { SchoolInfo } from "@/lib/school";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ ok: false, reason: "empty" });

  try {
    const { rows, result } = await neisRows<NeisSchoolRow>("schoolInfo", { SCHUL_NM: q }, 30);
    if (result?.CODE === "FETCH-FAIL" || result?.CODE.startsWith("HTTP-")) {
      return Response.json({ ok: false, reason: "fetch-fail" }, { status: 502 });
    }
    const all = rows.map(toSchool).filter((school): school is SchoolInfo => school !== null);
    // 이 앱은 초등학생용이라 초등학교를 우선 보여준다.
    const elementary = all.filter((school) => school.kind === "초등학교");
    const items = (elementary.length > 0 ? elementary : all).slice(0, 10);

    if (items.length === 0) {
      return Response.json({ ok: false, reason: result?.CODE === "ERROR-290" ? "no-key" : "no-data" });
    }

    return Response.json(
      { ok: true, items },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" }, { status: 502 });
  }
}
