"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

// 우리집 핀 찍기: 지도에서 🏠를 끌어서 놓기
export default function HomePicker({
  lat,
  lng,
  onMove,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [pos, setPos] = useState({ lat, lng });
  const cbRef = useRef(onMove);

  useEffect(() => {
    cbRef.current = onMove;
  });

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      const map = L.map(divRef.current).setView([lat, lng], 16);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const m = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({ className: "", html: `<div style="font-size:42px">🏠</div>`, iconSize: [48, 48], iconAnchor: [24, 24] }),
      }).addTo(map);
      markerRef.current = m;
      m.on("dragend", () => {
        const p = m.getLatLng();
        setPos({ lat: p.lat, lng: p.lng });
        cbRef.current(p.lat, p.lng);
      });
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.flyTo([pos.lat, pos.lng], 16, { duration: 0.6 });
  }, [pos.lat, pos.lng]);

  return (
    <div>
      <div ref={divRef} className="h-[280px] w-full rounded-3xl border-4 border-white shadow" role="application" aria-label="우리집 위치 정하기" />
      <p className="mt-2 text-center font-black">🏠를 끌어서 우리집 앞에 놓아봐!</p>
    </div>
  );
}
