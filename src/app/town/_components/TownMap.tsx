"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { TownFacility } from "@/lib/mock";
import "leaflet/dist/leaflet.css";

interface Props {
  found: string[];
  onDiscover: (id: string) => void;
  facilities: TownFacility[];
  center: { lat: number; lng: number; dong: string };
  expedition: { lat: number; lng: number; id: string } | null;
  onArrive: (id: string) => void;
  focus: { lat: number; lng: number; name: string } | null;
}

export default function TownMap({ found, onDiscover, facilities, center, expedition, onArrive, focus }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const stateRef = useRef({ found, onDiscover, facilities, center, expedition, onArrive, focus });

  useEffect(() => {
    stateRef.current = { found, onDiscover, facilities, center, expedition, onArrive, focus };
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      const { facilities: facs, center: c, found: f0 } = stateRef.current;

      const map = L.map(divRef.current).setView([c.lat, c.lng], 15);
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="font-size:36px">🏠</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>우리집( ${c.dong} )</b><br/>여기서 출발!`);

      for (const f of facs) {
        const m = L.marker([f.lat, f.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:32px;${f0.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        }).addTo(map);
        m.bindPopup(`<b>${f.name}</b><br/>${f.easy}`);
        m.on("click", () => stateRef.current.onDiscover(f.id));
        markersRef.current[f.id] = m;
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // 핀 목록이 바뀌면(진짜 장소 도착) 마커 다시 그림
  const facKey = facilities.map((f) => f.id).join(",");
  useEffect(() => {
    async function rebuild() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      for (const id of Object.keys(markersRef.current)) {
        markersRef.current[id]?.remove();
      }
      markersRef.current = {};
      for (const f of stateRef.current.facilities) {
        const m = L.marker([f.lat, f.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:32px;${stateRef.current.found.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        }).addTo(map);
        m.bindPopup(`<b>${f.name}</b><br/>${f.easy}`);
        m.on("click", () => stateRef.current.onDiscover(f.id));
        markersRef.current[f.id] = m;
      }
    }
    rebuild();
  }, [facKey]);

  useEffect(() => {
    async function refresh() {
      const L = (await import("leaflet")).default;
      for (const f of stateRef.current.facilities) {
        const m = markersRef.current[f.id];
        if (!m) continue;
        m.setIcon(
          L.divIcon({
            className: "",
            html: `<div style="font-size:32px;${found.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })
        );
      }
    }
    refresh();
  }, [found]);

  // 탐험 출발: 형님이 🏠에서 핀까지 진짜 길 따라 걸어감 (OSRM 도보 경로, 실패시 직선)
  const expId = expedition?.id ?? null;
  useEffect(() => {
    if (!expId) return;
    const id: string = expId;
    let raf = 0;
    let done = false;
    async function walk() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      const st = stateRef.current;
      const target = st.facilities.find((f) => f.id === id);
      if (!map || !target) {
        st.onArrive(id);
        return;
      }
      const from = st.center;
      // 도보 경로 조회 (10초 제한, 실패하면 직선)
      let path: Array<[number, number]> = [
        [from.lat, from.lng],
        [target.lat, target.lng],
      ];
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        const r = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`,
          { signal: ctrl.signal }
        );
        clearTimeout(t);
        if (r.ok) {
          const j = (await r.json()) as { routes?: Array<{ geometry?: { coordinates?: number[][] } }> };
          const coords = j.routes?.[0]?.geometry?.coordinates;
          if (coords && coords.length >= 2) path = coords.map(([lng, lat]) => [lat, lng]);
        }
      } catch {
        // 직선 폴백
      }
      const line = L.polyline(path, { dashArray: "8 8", color: "#f59e0b", weight: 5 }).addTo(map);
      map.flyToBounds(line.getBounds().pad(0.25), { duration: 0.8 });
      const me = L.marker(path[0], {
        icon: L.divIcon({ className: "", html: `<div style="font-size:38px">🕵️</div>`, iconSize: [44, 44], iconAnchor: [22, 22] }),
        zIndexOffset: 1000,
      }).addTo(map);
      // 구간 길이 누적 → 일정한 속도로 걷기
      const seg: number[] = [0];
      for (let i = 1; i < path.length; i++) {
        const dx = (path[i][1] - path[i - 1][1]) * 111320 * Math.cos((path[i][0] * Math.PI) / 180);
        const dy = (path[i][0] - path[i - 1][0]) * 110540;
        seg.push(seg[i - 1] + Math.hypot(dx, dy));
      }
      const total = Math.max(1, seg[seg.length - 1]);
      const dur = 4000;
      const t0 = performance.now();
      const at = (d: number): [number, number] => {
        let i = 1;
        while (i < seg.length - 1 && seg[i] < d) i++;
        const k = seg[i] === seg[i - 1] ? 0 : (d - seg[i - 1]) / (seg[i] - seg[i - 1]);
        return [
          path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k,
          path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k,
        ];
      };
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        me.setLatLng(at(total * k));
        if (k < 1) {
          raf = requestAnimationFrame(step);
        } else if (!done) {
          done = true;
          me.remove();
          line.remove();
          stateRef.current.onArrive(id);
        }
      };
      raf = requestAnimationFrame(step);
    }
    walk();
    return () => {
      cancelAnimationFrame(raf);
      done = true;
    };
  }, [expId]);

  // 직업 도감에서 넘어온 장소: 별 마커 + 확대 + 팝업
  const focusKey = focus ? `${focus.lat},${focus.lng},${focus.name}` : "";
  useEffect(() => {
    if (!focusKey) return;
    async function show() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) {
        setTimeout(show, 500);
        return;
      }
      const f = stateRef.current.focus;
      if (!f) return;
      map.flyTo([f.lat, f.lng], 17, { duration: 1 });
      L.marker([f.lat, f.lng], {
        icon: L.divIcon({ className: "", html: `<div style="font-size:40px">⭐</div>`, iconSize: [46, 46], iconAnchor: [23, 23] }),
        zIndexOffset: 900,
      })
        .addTo(map)
        .bindPopup(`<b>⭐ ${f.name}</b><br/>직업 도감에서 왔어!`)
        .openPopup();
    }
    show();
  }, [focusKey]);

  return (
    <div>
      <div ref={divRef} className="h-[340px] w-full rounded-3xl border-4 border-white shadow" role="application" aria-label={`${center.dong} 비밀지도`} />
      <p className="mt-2 text-sm font-bold text-stone-500">📍 {center.dong} 중심! 🏠에서 출발해 핀을 눌러봐. 위치추적은 안 해요. 🏠가 우리집이 아니면 홈에서 동네를 다시 정해줘!</p>
    </div>
  );
}
