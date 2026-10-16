// 집 찾기용 주소·장소 검색 프록시 (키: KAKAO_REST_KEY)
// 카카오 키워드 검색은 한국 주소·아파트·가게 이름에 강함. 키 없으면 {ok:false}
export async function GET(req: Request) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return Response.json({ ok: false, reason: "no-key" });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return Response.json({ ok: false, reason: "empty" });

  const headers = { Authorization: `KakaoAK ${key}` };
  try {
    // 지번·도로명 주소용 주소 검색 + 장소명용 키워드 검색을 병렬로
    const [addrRes, kwRes] = await Promise.all([
      fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}&size=8`, {
        headers,
        signal: AbortSignal.timeout(12000),
      }).catch(() => null),
      fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=8`, {
        headers,
        signal: AbortSignal.timeout(12000),
      }).catch(() => null),
    ]);

    const items: Array<{ id: string; name: string; addr: string; lat: number; lng: number }> = [];
    const seen = new Set<string>();

    if (addrRes?.ok) {
      const j = (await addrRes.json()) as {
        documents?: Array<{ address_name: string; road_address?: { address_name: string }; x: string; y: string }>;
      };
      for (const d of j.documents ?? []) {
        const lat = Number(d.y);
        const lng = Number(d.x);
        if (!d.address_name || !isFinite(lat) || !isFinite(lng)) continue;
        const key2 = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (seen.has(key2)) continue;
        seen.add(key2);
        items.push({
          id: `kakao-addr-${lat.toFixed(5)}-${lng.toFixed(5)}`,
          name: d.address_name,
          addr: d.road_address?.address_name ?? "",
          lat,
          lng,
        });
      }
    }

    if (kwRes?.ok) {
      const j = (await kwRes.json()) as {
        documents?: Array<{ id: string; place_name: string; address_name: string; road_address_name: string; x: string; y: string }>;
      };
      for (const d of j.documents ?? []) {
        const lat = Number(d.y);
        const lng = Number(d.x);
        if (!isFinite(lat) || !isFinite(lng)) continue;
        const key2 = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (seen.has(key2)) continue;
        seen.add(key2);
        items.push({
          id: `kakao-home-${d.id}`,
          name: d.place_name,
          addr: d.road_address_name || d.address_name,
          lat,
          lng,
        });
      }
    }

    return Response.json({ ok: true, count: items.length, items: items.slice(0, 10) });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
