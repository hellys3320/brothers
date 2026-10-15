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
}

export default function TownMap({ found, onDiscover, facilities, center, expedition, onArrive }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const stateRef = useRef({ found, onDiscover, facilities, center, expedition, onArrive });

  useEffect(() => {
    stateRef.current = { found, onDiscover, facilities, center, expedition, onArrive };
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

  // 탐험 출발: 형님이 🏠에서 핀까지 걸어감
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
      const line = L.polyline(
        [
          [from.lat, from.lng],
          [target.lat, target.lng],
        ],
        { dashArray: "8 8", color: "#f59e0b", weight: 4 }
      ).addTo(map);
      const me = L.marker([from.lat, from.lng], {
        icon: L.divIcon({ className: "", html: `<div style="font-size:38px">🕵️</div>`, iconSize: [44, 44], iconAnchor: [22, 22] }),
        zIndexOffset: 1000,
      }).addTo(map);
      const t0 = performance.now();
      const dur = 3200;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        me.setLatLng([from.lat + (target.lat - from.lat) * k, from.lng + (target.lng - from.lng) * k]);
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

  return (
    <div>
      <div ref={divRef} className="h-[340px] w-full rounded-3xl border-4 border-white shadow" role="application" aria-label={`${center.dong} 비밀지도`} />
      <p className="mt-2 text-sm font-bold text-stone-500">📍 {center.dong} 중심! 🏠에서 출발해 핀을 눌러봐. 위치추적은 안 해요. 🏠가 우리집이 아니면 홈에서 동네를 다시 정해줘!</p>
    </div>
  );
}
