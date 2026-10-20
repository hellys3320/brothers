// 오늘의 급식 프록시 (NEIS 급식식단정보)
// 학교 검색 결과의 officeCode·schoolCode를 그대로 넘겨받는다.
import { kstToday, neisRows, parseMeal, type NeisMealRow } from "@/lib/neis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const office = (searchParams.get("office") ?? "").trim().toUpperCase();
  const school = (searchParams.get("school") ?? "").trim();
  const date = (searchParams.get("date") ?? "").trim() || kstToday();

  if (!/^[A-Z]\d{2}$/.test(office) || !/^\d+$/.test(school)) {
    return Response.json({ ok: false, reason: "bad-school" }, { status: 400 });
  }
  if (!/^\d{8}$/.test(date)) {
    return Response.json({ ok: false, reason: "bad-date" }, { status: 400 });
  }

  try {
    const { rows, result } = await neisRows<NeisMealRow>(
      "mealServiceDietInfo",
      {
        ATPT_OFCDC_SC_CODE: office,
        SD_SCHUL_CODE: school,
        MLSV_YMD: date,
      },
      10
    );

    if (result?.CODE === "FETCH-FAIL" || result?.CODE.startsWith("HTTP-")) {
      return Response.json({ ok: false, reason: "fetch-fail" }, { status: 502 });
    }

    if (rows.length === 0) {
      return Response.json(
        { ok: false, reason: result?.CODE === "ERROR-290" ? "no-key" : "no-data", date },
        { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=21600" } }
      );
    }

    // 보통 중식(2)을 보여주고, 중식이 없으면 첫 급식을 보여준다.
    const row = rows.find((item) => item.MMEAL_SC_CODE === "2") ?? rows[0];
    return Response.json(
      { ok: true, meal: parseMeal(row) },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=21600" } }
    );
  } catch {
    return Response.json({ ok: false, reason: "fetch-fail" }, { status: 502 });
  }
}
