"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import lottie, { type AnimationItem } from "lottie-web";
import type { TownFacility } from "@/lib/mock";
import { distM, walkInfo } from "@/lib/realTown";
import "leaflet/dist/leaflet.css";

// 걷기 캐릭터: LottieFiles 무료 "Hiker Walking" (배낭 멘 탐험가, 디자이너 제작 벡터)
// 파일: public/animations/walk.json

interface Props {
  found: string[];
  onDiscover: (id: string) => void;
  facilities: TownFacility[];
  center: { lat: number; lng: number; dong: string };
  expedition: { lat: number; lng: number; id: string } | null;
  onArrive: (id: string) => void;
  focusPlaceId: string | null;
  onFocusDone: () => void;
  mapApiRef: MutableRefObject<MapApi | null>;
}

export interface MapApi {
  goHome: () => void;
  focusPlace: (id: string) => void;
}

export default function TownMap({ found, onDiscover, facilities, center, expedition, onArrive, focusPlaceId, onFocusDone, mapApiRef }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const homeRef = useRef<Marker | null>(null);
  const stateRef = useRef({ found, onDiscover, facilities, center, expedition, onArrive });

  useEffect(() => {
    stateRef.current = { found, onDiscover, facilities, center, expedition, onArrive };
  });

  // 핀 팝업: 장소 설명 + 집에서 거리/도보시간
  const popupFor = (f: TownFacility) => {
    const c = stateRef.current.center;
    return `<b>${f.name}</b><br/>${f.easy}<br/>🧭 ${walkInfo(distM(c.lat, c.lng, f.lat, f.lng))}`;
  };

  // 우리집 바로가기 + 장소 포커싱 API
  useEffect(() => {
    async function focusMarker(id: string) {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return false;
      const m = markersRef.current[id];
      if (!m) return false;
      const p = m.getLatLng();
      map.flyTo(p, Math.max(map.getZoom(), 16), { duration: 0.8 });
      setTimeout(() => m.openPopup(), 850);
      void L;
      return true;
    }
    mapApiRef.current = {
      goHome() {
        const map = mapRef.current;
        if (!map) return;
        const c = stateRef.current.center;
        map.flyTo([c.lat, c.lng], 15, { duration: 0.8 });
        setTimeout(() => homeRef.current?.openPopup(), 850);
      },
      focusPlace(id: string) {
        void focusMarker(id);
      },
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      const { facilities: facs, center: c, found: f0 } = stateRef.current;

      const map = L.map(divRef.current).setView([c.lat, c.lng], 16);
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const home = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="font-size:36px">🏠</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>우리집( ${c.dong} )</b><br/>여기서 출발!`);
      homeRef.current = home;

      for (const f of facs) {
        const m = L.marker([f.lat, f.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:32px;${f0.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        }).addTo(map);
        m.bindPopup(popupFor(f));
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
        m.bindPopup(popupFor(f));
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

  // 탐험 출발: Lottie 걷기 캐릭터가 🏠에서 핀까지 진짜 길 따라 걸어감
  const expId = expedition?.id ?? null;
  useEffect(() => {
    if (!expId) return;
    const id: string = expId;
    let raf = 0;
    let done = false;
    let anim: AnimationItem | null = null;
    async function walk() {
      const [{ default: L }, walkRes] = await Promise.all([
        import("leaflet"),
        fetch("/animations/walk.json").then((r) => r.json()),
      ]);
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
      if (done) return;
      const line = L.polyline(path, { dashArray: "8 8", color: "#f59e0b", weight: 5 }).addTo(map);
      map.flyToBounds(line.getBounds().pad(0.25), { duration: 0.8 });
      const walkEast = target.lng >= from.lng;
      const me = L.marker(path[0], {
        icon: L.divIcon({
          className: "",
          html: `<div class="walker-lottie" style="width:64px;height:64px;${walkEast ? "" : "transform:scaleX(-1);" }"></div>`,
          iconSize: [64, 64],
          iconAnchor: [32, 58],
        }),
        zIndexOffset: 1000,
      }).addTo(map);
      const box = me.getElement()?.querySelector(".walker-lottie") as HTMLElement | null;
      if (box) {
        anim = lottie.loadAnimation({ container: box, renderer: "svg", loop: true, autoplay: true, animationData: walkRes });
      }
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
      let lastSeg = 0;
      const faceSeg = (i: number) => {
        // 코너를 돌 때마다 그 구간 방향을 보고 뒤집기 (캐릭터 정면이 오른쪽 기준)
        if (!box || i === lastSeg) return;
        lastSeg = i;
        const dx = path[i][1] - path[i - 1][1];
        if (Math.abs(dx) > 1e-9) box.style.transform = dx >= 0 ? "" : "scaleX(-1)";
      };
      const at = (d: number): [number, number] => {
        let i = 1;
        while (i < seg.length - 1 && seg[i] < d) i++;
        const k = seg[i] === seg[i - 1] ? 0 : (d - seg[i - 1]) / (seg[i] - seg[i - 1]);
        faceSeg(i);
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
          anim?.destroy();
          anim = null;
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
      anim?.destroy();
      anim = null;
    };
  }, [expId]);

  // 목록에서 장소를 탭하면 지도 포커싱
  useEffect(() => {
    if (!focusPlaceId) return;
    const id: string = focusPlaceId;
    let tries = 0;
    let stop = false;
    async function attempt() {
      const map = mapRef.current;
      const m = markersRef.current[id];
      if (map && m) {
        const p = m.getLatLng();
        map.flyTo(p, Math.max(map.getZoom(), 16), { duration: 0.8 });
        setTimeout(() => {
          if (!stop) m.openPopup();
        }, 850);
        onFocusDone();
        return;
      }
      tries++;
      if (!stop && tries < 10) setTimeout(attempt, 400);
      else onFocusDone();
    }
    attempt();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPlaceId]);

  return (
    <div>
      <div ref={divRef} id="town-map" className="isolate relative z-0 h-[340px] w-full scroll-mt-24 rounded-3xl border-4 border-white shadow" role="application" aria-label={`${center.dong} 비밀지도`} />
      <p className="mt-2 text-sm font-bold text-stone-500">📍 {center.dong} 중심! 🏠에서 출발해 핀을 눌러봐. 위치추적은 안 해요. 🏠가 우리집이 아니면 홈에서 동네를 다시 정해줘!</p>
    </div>
  );
}
