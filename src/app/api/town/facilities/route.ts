import { NextResponse } from "next/server";
import { MOCK_TOWN } from "@/lib/mock";

// GET /api/town/facilities
// 나중에 SGIS/공공데이터포털로 교체. 지금은 목데이터 + ISR 캐시 예시.
export async function GET() {
  return NextResponse.json(
    { dong: "햇살동", count: MOCK_TOWN.length, items: MOCK_TOWN },
    { headers: { "Cache-Control": "public, s-maxage=86400" } }
  );
}
