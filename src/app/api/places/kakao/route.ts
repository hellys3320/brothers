// 카카오 로컬 프록시 (키: KAKAO_REST_KEY, 없으면 {ok:false})
// 키워드+카테고리 검색을 한 번에: 빵집·도서관·공원·학교·병원·약국·소방서·경찰서
// developers.kakao.com → 내 애플리케이션 → REST API 키 (즉시 발급, 승인 없음)
const KAKAO = "https://dapi.kakao.com";

interface KakaoDoc {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  place_url: string;
  distance: string;
}

async function kakaoGet(key: string, path: string, params: Record<string, string>): Promise<KakaoDoc[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${KAKAO}${path}?${qs}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as { documents?: KakaoDoc[] };
  return j.documents ?? [];
}

export interface KakaoPlace {
  id: string;
  name: string;
  kind: "도서관" | "공원" | "학교" | "빵집" | "병원" | "안전지킴이집";
  stamp: string;
  easy: string;
  lat: number;
  lng: number;
}

function toPlace(
  d: KakaoDoc,
  kind: KakaoPlace["kind"],
  stamp: string
): KakaoPlace | null {
  const lat = Number(d.y);
  const lng = Number(d.x);
  if (!d.place_name || !isFinite(lat) || !isFinite(lng)) return null;
  const m = Number(d.distance);
  const walk = isFinite(m) ? (m < 150 ? "바로 앞!" : `약 ${Math.round(m / 100) * 100}m!`) : "";
  const kindWord = kind === "안전지킴이집" ? "위험할 때 도와주는 곳" : `진짜 ${kind}`;
  return {
    id: `kakao-${d.id}`,
    name: d.place_name,
    kind,
    stamp,
    easy: `${kindWord}! ${walk}`.trim(),
    lat,
    lng,
  };
}

// 동네 지도용 한 번에 조회
async function townPlaces(key: string, lat: number, lng: number, dong: string, radius: number): Promise<KakaoPlace[]> {
  const x = String(lng);
  const y = String(lat);
  const R = String(Math.min(10000, Math.max(1000, radius)));
  const [bakeries, libs, parks, hospitals, pharmacies, schools, cares, fires, polices] = await Promise.all([
    kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 빵집`, x, y, radius: R, sort: "distance", size: "6" }),
    kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 도서관`, x, y, radius: R, sort: "distance", size: "6" }),
    kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 공원`, x, y, radius: R, sort: "distance", size: "8" }),
    kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "HP8", x, y, radius: R, sort: "distance", size: "8" }),
    kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "PM9", x, y, radius: R, sort: "distance", size: "8" }),
    kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "SC4", x, y, radius: R, sort: "distance", size: "10" }),
    kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "PS3", x, y, radius: R, sort: "distance", size: "6" }),
    kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 소방서`, x, y, radius: R, sort: "distance", size: "4" }),
    kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 경찰서`, x, y, radius: R, sort: "distance", size: "4" }),
  ]);

  const out: KakaoPlace[] = [];
  const push = (p: KakaoPlace | null, cap: number, kind: KakaoPlace["kind"]) => {
    if (!p) return;
    if (out.filter((o) => o.kind === kind).length >= cap) return;
    if (out.some((o) => o.name === p.name)) return;
    out.push(p);
  };

  bakeries.slice(0, 3).forEach((d) => push(toPlace(d, "빵집", "🍞"), 3, "빵집"));
  libs.slice(0, 3).forEach((d) => push(toPlace(d, "도서관", "📚"), 3, "도서관"));
  parks.slice(0, 4).forEach((d) => push(toPlace(d, "공원", "🌳"), 4, "공원"));
  hospitals.slice(0, 3).forEach((d) => push(toPlace(d, "병원", "🏥"), 3, "병원"));
  pharmacies.slice(0, 2).forEach((d) => push(toPlace(d, "병원", "💊"), 3, "병원"));
  schools
    .filter((d) => d.category_name.includes("초등") || d.place_name.includes("초등"))
    .slice(0, 2)
    .forEach((d) => push(toPlace(d, "학교", "🏫"), 2, "학교"));
  cares.slice(0, 1).forEach((d) => push(toPlace(d, "학교", "🧸"), 2, "학교"));
  fires.slice(0, 1).forEach((d) => push(toPlace(d, "안전지킴이집", "🛟"), 2, "안전지킴이집"));
  polices.slice(0, 1).forEach((d) => push(toPlace(d, "안전지킴이집", "🛟"), 2, "안전지킴이집"));
  return out;
}

// 직업 상세용 (job=baker 등)
async function jobPlaces(
  key: string,
  job: string,
  lat: number,
  lng: number,
  dong: string
): Promise<KakaoPlace[]> {
  const x = String(lng);
  const y = String(lat);
  const K = { radius: "3000", sort: "distance" } as const;
  switch (job) {
    case "baker": {
      const docs = await kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 빵집`, x, y, ...K, size: "8" });
      return docs.slice(0, 5).map((d) => toPlace(d, "빵집", "🍞")).filter((p): p is KakaoPlace => !!p);
    }
    case "nurse": {
      const [h, p] = await Promise.all([
        kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "HP8", x, y, ...K, size: "8" }),
        kakaoGet(key, "/v2/local/search/category.json", { category_group_code: "PM9", x, y, ...K, size: "8" }),
      ]);
      return [...h.slice(0, 3), ...p.slice(0, 2)]
        .map((d, i) => toPlace(d, "병원", i >= 3 ? "💊" : "🏥"))
        .filter((p): p is KakaoPlace => !!p);
    }
    case "librarian": {
      const docs = await kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 도서관`, x, y, ...K, size: "8" });
      return docs.slice(0, 5).map((d) => toPlace(d, "도서관", "📚")).filter((p): p is KakaoPlace => !!p);
    }
    case "fire": {
      const docs = await kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 소방서`, x, y, radius: "5000", sort: "distance", size: "5" });
      return docs.slice(0, 3).map((d) => toPlace(d, "안전지킴이집", "🛟")).filter((p): p is KakaoPlace => !!p);
    }
    case "toon": {
      const docs = await kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 서점`, x, y, ...K, size: "8" });
      return docs.slice(0, 5).map((d) => toPlace(d, "도서관", "📖")).filter((p): p is KakaoPlace => !!p);
    }
    case "drone": {
      const docs = await kakaoGet(key, "/v2/local/search/keyword.json", { query: `${dong} 공원`, x, y, ...K, size: "8" });
      return docs.slice(0, 5).map((d) => toPlace(d, "공원", "🛸")).filter((p): p is KakaoPlace => !!p);
    }
    default:
      return [];
  }
}

export async function GET(req: Request) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return Response.json({ ok: false, reason: "no-key" });
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const dong = searchParams.get("dong") ?? "";
  const job = searchParams.get("job");
  const radius = Math.min(10000, Math.max(1000, Number(searchParams.get("radius") ?? "3000") || 3000));
  if (!isFinite(lat) || !isFinite(lng)) return Response.json({ ok: false, reason: "bad-coords" });

  try {
    const items = job ? await jobPlaces(key, job, lat, lng, dong) : await townPlaces(key, lat, lng, dong, radius);
    return Response.json({ ok: true, count: items.length, items });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
