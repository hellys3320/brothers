"use client";

import { useEffect, useState } from "react";
import MissionSection from "./MissionSection";
import ThanksButton from "./ThanksButton";
import { getXP, levelFor } from "@/lib/xp";
import { loadMe } from "@/lib/me";
import type { JobField, JobRarity } from "@/lib/mock";

export default function JobExtra({
  code,
  name,
  spot,
  field,
  rarity,
}: {
  code: string;
  name: string;
  spot: string;
  field: JobField;
  rarity: JobRarity;
}) {
  // 첫 렌더는 서버와 맞추고, 마운트 후 localStorage 값을 읽는다
  const [xp, setXp] = useState(0);
  const [dong, setDong] = useState("우리동네");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setXp(getXP());
    setDong(loadMe()?.dong ?? "우리동네");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const locked = rarity === "레전드" && levelFor(xp).lv < 3;

  return (
    <div className="flex flex-col gap-5">
      <MissionSection code={code} name={name} spot={spot} field={field} locked={locked} />
      <ThanksButton code={code} dong={dong} spot={spot} locked={locked} />
    </div>
  );
}
