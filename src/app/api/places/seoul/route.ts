// 서울열린데이터광장 프록시 (키: SEOUL_API_KEY, 없으면 {ok:false})
// 도서관(SeoulLibraryTimeInfo, 위경도 직접) + 주요공원(SearchParkInfoService, 위경도 직접)

const BASE = "http://openapi.seoul.go.kr:8088";

interface SeoulRow {
  [k: string]: string | undefined;
}

async function seoulRows(key: string, svc: string, s: number, e: number): Promise<{ total: number; rows: SeoulRow[] }> {
  const res = await fetch(`${BASE}/${key}/json/${svc}/${s}/${e}`);
  if (!res.ok) throw new Error(`seoul ${svc} ${res.status}`);
  const j = (await res.json()) as Record<string, { list_total_count: number; RESULT: { CODE: string }; row?: SeoulRow[] }>;
  const root = j[svc];
  if (!root || root.RESULT?.CODE !== "INFO-000") throw new Error(`seoul ${svc} bad result`);
  return { total: root.list_total_count ?? 0, rows: root.row ?? [] };
}

function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface SeoulPlace {
  id: string;
  name: string;
  kind: "도서관" | "공원";
  stamp: string;
  easy: string;
  lat: number;
  lng: number;
}

export async function GET(req: Request) {
  const key = process.env.SEOUL_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "no-key" });
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!isFinite(lat) || !isFinite(lng)) return Response.json({ ok: false, reason: "bad-coords" });

  try {
    const lib1 = await seoulRows(key, "SeoulLibraryTimeInfo", 1, 1000);
    let libRows = lib1.rows;
    if (lib1.total > 1000) {
      const lib2 = await seoulRows(key, "SeoulLibraryTimeInfo", 1001, Math.min(lib1.total, 2000));
      libRows = libRows.concat(lib2.rows);
    }
    const park = await seoulRows(key, "SearchParkInfoService", 1, 200);

    const items: SeoulPlace[] = [];
    for (const r of libRows) {
      const plat = Number(r.XCNTS);
      const plng = Number(r.YDNTS);
      if (!r.LBRRY_NAME || !isFinite(plat) || !isFinite(plng)) continue;
      if (distM(lat, lng, plat, plng) > 4000) continue;
      const m = Math.round(distM(lat, lng, plat, plng) / 100) * 100;
      items.push({
        id: `seoul-lib-${r.LBRRY_SEQ_NO ?? r.LBRRY_NAME}`,
        name: r.LBRRY_NAME,
        kind: "도서관",
        stamp: "📚",
        easy: `서울시 데이터 속 진짜 도서관! 약 ${m}m!`,
        lat: plat,
        lng: plng,
      });
    }
    for (const r of park.rows) {
      const plat = Number(r.YCRD);
      const plng = Number(r.XCRD);
      if (!r.PARK_NM || !isFinite(plat) || !isFinite(plng)) continue;
      if (distM(lat, lng, plat, plng) > 5000) continue;
      const m = Math.round(distM(lat, lng, plat, plng) / 100) * 100;
      items.push({
        id: `seoul-park-${r.SN ?? r.PARK_NM}`,
        name: r.PARK_NM,
        kind: "공원",
        stamp: "🌳",
        easy: `서울시 데이터 속 진짜 공원! 약 ${m}m!`,
        lat: plat,
        lng: plng,
      });
    }
    items.sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng));
    return Response.json({ ok: true, count: items.length, items: items.slice(0, 8) });
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" });
  }
}
