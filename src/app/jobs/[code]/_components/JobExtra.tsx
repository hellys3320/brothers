"use client";

import { useState } from "react";
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
  const [xp] = useState(() => getXP());
  const [dong] = useState(() => loadMe()?.dong ?? "우리동네");
  const locked = rarity === "레전드" && levelFor(xp).lv < 3;

  return (
    <div className="flex flex-col gap-5">
      <MissionSection code={code} name={name} spot={spot} field={field} locked={locked} />
      <ThanksButton code={code} dong={dong} spot={spot} locked={locked} />
    </div>
  );
}
