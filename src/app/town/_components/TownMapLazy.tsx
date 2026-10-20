"use client";

import { useEffect, useState, type ComponentType } from "react";
import type TownMap from "./TownMap";

type Props = React.ComponentProps<typeof TownMap>;

// Leaflet은 브라우저에서만 동작하므로, SSR 때는 자리표시자를 그리고
// 마운트 후에 지도 모듈을 불러온다. (next/dynamic ssr:false의 SSR bailout 회피)
export default function TownMapLazy(props: Props) {
  const [Comp, setComp] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    let live = true;
    import("./TownMap")
      .then((m) => {
        if (live) setComp(() => m.default);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) {
    return <p className="rounded-3xl bg-white p-6 text-xl font-black">🗺️ 지도를 준비중...</p>;
  }
  return <Comp {...props} />;
}
