"use client";

import { useEffect, useRef } from "react";
import type { Layer, Map as LeafletMap } from "leaflet";
import { MOCK_TOWN } from "@/lib/mock";
import "leaflet/dist/leaflet.css";

interface Props {
  found: string[];
  onDiscover: (id: string) => void;
}

export default function TownMap({ found, onDiscover }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const foundRef = useRef<string[]>(found);
  const cbRef = useRef(onDiscover);

  // 렌더 중 ref 쓰기 금지 → 이펙트에서 동기화
  useEffect(() => {
    foundRef.current = found;
  }, [found]);
  useEffect(() => {
    cbRef.current = onDiscover;
  }, [onDiscover]);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;

      map = L.map(divRef.current).setView([37.5668, 126.9785], 16);
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      for (const f of MOCK_TOWN) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="font-size:32px;filter:${foundRef.current.includes(f.id) ? "none" : "grayscale(1)"}">${f.stamp}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        const m = L.marker([f.lat, f.lng], { icon }).addTo(map);
        m.bindPopup(`<b>${f.name}</b><br/>${f.easy}<br/>안전: ${f.safeLevel}`);
        m.on("click", () => cbRef.current(f.id));
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // 찾음 상태가 바뀌면 아이콘 색만 갱신 (지도는 유지)
  useEffect(() => {
    async function refresh() {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;
      mapRef.current.eachLayer((layer: Layer) => {
        if (layer instanceof L.Marker) {
          const latlng = layer.getLatLng();
          const f = MOCK_TOWN.find(
            (x) => Math.abs(x.lat - latlng.lat) < 1e-9 && Math.abs(x.lng - latlng.lng) < 1e-9
          );
          if (f) {
            layer.setIcon(
              L.divIcon({
                className: "",
                html: `<div style="font-size:32px;${found.includes(f.id) ? "" : "filter:grayscale(1);opacity:.6"}">${f.stamp}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              })
            );
          }
        }
      });
    }
    refresh();
  }, [found]);

  return (
    <div>
      <div ref={divRef} className="h-[340px] w-full rounded-3xl border-4 border-white shadow" role="application" aria-label="우리동네 비밀지도" />
      <p className="mt-2 text-sm font-bold text-stone-500">지도는 OpenStreetMap이에요. 핀을 눌러도 탐험돼요. 위치추적은 안 해요.</p>
    </div>
  );
}
