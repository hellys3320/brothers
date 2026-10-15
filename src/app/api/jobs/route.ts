import { NextResponse } from "next/server";
import { MOCK_JOBS } from "@/lib/mock";

// GET /api/jobs
export async function GET() {
  return NextResponse.json(
    { count: MOCK_JOBS.length, items: MOCK_JOBS },
    { headers: { "Cache-Control": "public, s-maxage=86400" } }
  );
}
