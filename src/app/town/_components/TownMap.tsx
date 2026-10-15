"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { MOCK_TOWN } from "@/lib/mock";
import { loadMe } from "@/lib/me";
import "leaflet/dist/leaflet.css";

interface Props {
  found: string[];
  onDiscover: (id: string) => void;
}

// 비밀 5곳을 동네 중심 주변에 배치 (도보 탐험 느낌)
const OFFS: Record<string, [number, number]> = {
  "lib-1": [0.001, 0],
  "park-1": [-0.001, 0.002],
  "hosp-1": [0, -0.002],
  "safe-1": [0.0005, 0.001],
  "road-1": [-0.0013, -0.001],
};

function homeBase() {
  if (typeof window === "undefined") return { lat: 37.5668, lng: 126.9785, dong: "햇살동" };
  const me = loadMe();
  if (me) return { lat: me.lat, lng: me.lng, dong: me.dong };
  return { lat: 37.5668, lng: 126.9785, dong: "햇살동" };
}

export default function TownMap({ found, onDiscover }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const [base] = useState(homeBase);
  const foundRef = useRef(found);
  const cbRef = useRef(onDiscover);

  useEffect(() => {
    foundRef.current = found;
  }, [found]);
  useEffect(() => {
    cbRef.current = onDiscover;
  }, [onDiscover]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;

      const map = L.map(divRef.current).setView([base.lat, base.lng], 15);
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      L.marker([base.lat, base.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="font-size:36px">🏠</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>우리집( ${base.dong} )</b><br/>여기서 출발!`);

      for (const f of MOCK_TOWN) {
        const [dlat, dlng] = OFFS[f.id] ?? [0, 0];
        const icon = L.divIcon({
          className: "",
          html: `<div style="font-size:32px;${foundRef.current.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        const m = L.marker([base.lat + dlat, base.lng + dlng], { icon }).addTo(map);
        m.bindPopup(`<b>${f.name}</b><br/>${f.easy}<br/>안전: ${f.safeLevel}`);
        m.on("click", () => cbRef.current(f.id));
        markersRef.current[f.id] = m;
      }
    }
    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function refresh() {
      const L = (await import("leaflet")).default;
      for (const f of MOCK_TOWN) {
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

  return (
    <div>
      <div ref={divRef} className="h-[340px] w-full rounded-3xl border-4 border-white shadow" role="application" aria-label={`${base.dong} 비밀지도`} />
      <p className="mt-2 text-sm font-bold text-stone-500">📍 {base.dong} 중심! 🏠에서 출발해 핀을 눌러봐. 위치추적은 안 해요.</p>
    </div>
  );
}
