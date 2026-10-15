// 집 찾기용 주소·장소 검색 프록시 (키: KAKAO_REST_KEY)
// 카카오 키워드 검색은 한국 주소·아파트·가게 이름에 강함. 키 없으면 {ok:false}
export async function GET(req: Request) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return Response.json({ ok: false, reason: "no-key" });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return Response.json({ ok: false, reason: "empty" });

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=8`,
      { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return Response.json({ ok: false, reason: `kakao-${res.status}` });
    const j = (await res.json()) as {
      documents?: Array<{
        id: string;
        place_name: string;
        address_name: string;
        road_address_name: string;
        x: string;
        y: string;
      }>;
    };
    const items = (j.documents ?? [])
      .filter((d) => isFinite(Number(d.y)) && isFinite(Number(d.x)))
      .map((d) => ({
        id: `kakao-home-${d.id}`,
        name: d.place_name,
        addr: d.road_address_name || d.address_name,
        lat: Number(d.y),
        lng: Number(d.x),
      }));
    return Response.json({ ok: true, count: items.length, items });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
