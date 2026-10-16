"use client";

import { useEffect, useState } from "react";
import { loadMe } from "@/lib/me";

interface Wx {
  temp: number;
  code: number;
  wind: number;
  rainProb: number;
}

function advice(w: Wx): string {
  if ([71, 73, 75, 77, 85, 86].includes(w.code)) return "❄️ 눈이 와! 따뜻하게 입고 눈 구경!";
  if (w.code >= 51 || w.rainProb >= 60) return "☂️ 비 와! 우산 꼭 챙겨!";
  if (w.temp >= 30) return "🥵 더워! 물 많이 마시고 그늘에서 놀아!";
  if (w.temp <= 3) return "🧤 추워! 목도리 꽉 매!";
  if (w.wind >= 10) return "🍃 바람 세! 모자 날아가지 않게!";
  if (w.code <= 1) return "☀️ 밖에 놀기 딱 좋은 날!";
  return "⛅ 구름 낀 날! 산책하기 좋아!";
}

function skyEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80) return "⛈️";
  return "🌤️";
}

export default function WeatherCard() {
  const [wx, setWx] = useState<Wx | null>(null);

  useEffect(() => {
    const me = loadMe();
    const lat = me?.lat ?? 37.5665;
    const lng = me?.lng ?? 126.978;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.current) return;
        setWx({
          temp: Math.round(j.current.temperature_2m),
          code: j.current.weather_code ?? 0,
          wind: j.current.wind_speed_10m ?? 0,
          rainProb: j.daily?.precipitation_probability_max?.[0] ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => clearTimeout(t));
  }, []);

  if (!wx) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-r from-sky-200 to-emerald-200 p-5 text-center shadow">
      <p className="text-xl font-black">
        {skyEmoji(wx.code)} 지금 {wx.temp}°C
      </p>
      <p className="text-lg font-bold">{advice(wx)}</p>
    </div>
  );
}
