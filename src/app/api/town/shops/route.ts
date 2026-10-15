import { NextResponse } from "next/server";
import { MOCK_SHOPS } from "@/lib/shops";

// GET /api/town/shops?dong=햇살동&job=baker
// 실데이터 연결 준비: DATA_GO_KR_KEY가 있으면 공공데이터포털
// 소상공인 상가(상권)정보 API로 교체. 없으면 목데이터 반환.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const job = searchParams.get("job");
  const dong = searchParams.get("dong");

  let items = MOCK_SHOPS;
  if (job) items = items.filter((s) => s.jobCode === job);
  if (dong) items = items.filter((s) => s.dong === dong);

  const mode = process.env.DATA_GO_KR_KEY ? "live-todo" : "mock";
  return NextResponse.json(
    { mode, count: items.length, items, note: "실API 연결 시 상가(상권)정보 API로 교체 예정" },
    { headers: { "Cache-Control": "public, s-maxage=86400" } }
  );
}
