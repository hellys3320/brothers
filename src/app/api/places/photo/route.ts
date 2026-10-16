// 장소 사진 프록시 (네이버 이미지 검색, 키 없으면 {ok:false})
// developers.naver.com → 애플리케이션 등록 → 검색 API (무료 25,000건/일)
export async function GET(req: Request) {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return Response.json({ ok: false, reason: "no-key" });
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") ?? "").trim();
  const dong = (searchParams.get("dong") ?? "").trim();
  if (!name) return Response.json({ ok: false, reason: "empty" });

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(`${name} ${dong}`)}&display=3&sort=sim&filter=medium`,
      {
        headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!res.ok) return Response.json({ ok: false, reason: `naver-${res.status}` });
    const j = (await res.json()) as {
      items?: Array<{ title: string; link: string; thumbnail: string }>;
    };
    const items = (j.items ?? [])
      .filter((i) => i.thumbnail?.startsWith("http"))
      .map((i) => ({ thumb: i.thumbnail, link: i.link }));
    return Response.json({ ok: true, count: items.length, items });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
