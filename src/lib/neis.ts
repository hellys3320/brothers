// 나이스 교육정보 개방 포털(NEIS) 서버 전용 도우미
// 인증키는 NEIS_API_KEY 환경변수에 넣는다. 없으면 샘플 조회로 시도한다.
import { request } from "node:https";
import type { MealInfo, SchoolInfo } from "./school";

const BASE = "https://open.neis.go.kr/hub";

export interface NeisResult {
  CODE: string;
  MESSAGE: string;
}

interface NeisPart<T> {
  head?: unknown;
  row?: T[];
}

type NeisPayload<T> = Record<string, NeisPart<T>[] | NeisResult | undefined>;

function isNeisResult(value: unknown): value is NeisResult {
  return (
    !!value &&
    typeof value === "object" &&
    "CODE" in value &&
    "MESSAGE" in value
  );
}

export interface NeisSchoolRow {
  ATPT_OFCDC_SC_CODE?: string;
  ATPT_OFCDC_SC_NM?: string;
  SD_SCHUL_CODE?: string;
  SCHUL_NM?: string;
  SCHUL_KND_SC_NM?: string;
  ORG_RDNMA?: string;
  ORG_RDNDA?: string;
  LCTN_SC_NM?: string;
}

export interface NeisMealRow {
  MMEAL_SC_CODE?: string;
  MMEAL_SC_NM?: string;
  MLSV_YMD?: string;
  DDISH_NM?: string;
  CAL_INFO?: string;
  SCHUL_NM?: string;
}

export const ALLERGEN_NAMES: Record<number, string> = {
  1: "난류",
  2: "우유",
  3: "메밀",
  4: "땅콩",
  5: "대두",
  6: "밀",
  7: "고등어",
  8: "게",
  9: "새우",
  10: "돼지고기",
  11: "복숭아",
  12: "토마토",
  13: "아황산류",
  14: "호두",
  15: "닭고기",
  16: "쇠고기",
  17: "오징어",
  18: "조개류",
  19: "잣",
};

function getJson(url: URL): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: {
          // NEIS 쪽 WAF가 Accept: application/json이나 Node 기본 User-Agent를 500으로 막는 경우가 있어
          // 일반 브라우저와 같은 형태로 요청한다. (응답은 Type=json으로 받는다)
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0",
          Connection: "keep-alive",
        },
        timeout: 12000,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`NEIS HTTP ${status}`));
          return;
        }
        res.setEncoding("utf8");
        let body = "";
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("NEIS timeout")));
    req.on("error", reject);
    req.end();
  });
}

export async function neisRows<T>(
  endpoint: "schoolInfo" | "mealServiceDietInfo",
  params: Record<string, string>,
  pSize = 20
): Promise<{ rows: T[]; result?: NeisResult }> {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", String(pSize));
  const key = process.env.NEIS_API_KEY?.trim();
  if (key) url.searchParams.set("KEY", key);
  for (const [name, value] of Object.entries(params)) {
    if (value) url.searchParams.set(name, value);
  }

  let data: NeisPayload<T>;
  try {
    data = (await getJson(url)) as NeisPayload<T>;
  } catch (error) {
    return {
      rows: [],
      result: {
        CODE: "FETCH-FAIL",
        MESSAGE: error instanceof Error ? error.message : "NEIS request failed",
      },
    };
  }
  const result = isNeisResult(data.RESULT) ? data.RESULT : undefined;
  const parts = data[endpoint];
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (Array.isArray(part.row)) {
        return { rows: part.row, result };
      }
    }
  }
  return { rows: [], result };
}

export function toSchool(row: NeisSchoolRow): SchoolInfo | null {
  const officeCode = (row.ATPT_OFCDC_SC_CODE ?? "").trim();
  const schoolCode = (row.SD_SCHUL_CODE ?? "").trim();
  const name = (row.SCHUL_NM ?? "").trim();
  if (!officeCode || !schoolCode || !name) return null;
  const address = [(row.ORG_RDNMA ?? "").trim(), (row.ORG_RDNDA ?? "").trim()]
    .filter(Boolean)
    .join(" ");
  return {
    officeCode,
    officeName: (row.ATPT_OFCDC_SC_NM ?? "").trim(),
    schoolCode,
    name,
    kind: (row.SCHUL_KND_SC_NM ?? "").trim(),
    address,
    location: (row.LCTN_SC_NM ?? "").trim() || undefined,
  };
}

export function parseMeal(row: NeisMealRow): MealInfo {
  const dishes: string[] = [];
  const codes = new Set<number>();
  const lines = (row.DDISH_NM ?? "")
    .replace(/&nbsp;/g, " ")
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    let name = line;
    const allergy = line.match(/\(([\d.]+)\)\s*$/);
    if (allergy) {
      name = line.slice(0, allergy.index).trim();
      for (const raw of allergy[1].split(".")) {
        const code = Number(raw);
        if (Number.isInteger(code) && code > 0) codes.add(code);
      }
    }
    name = name.replace(/\*+$/g, "").trim();
    if (name) dishes.push(name);
  }

  return {
    date: (row.MLSV_YMD ?? "").trim(),
    mealName: (row.MMEAL_SC_NM ?? "급식").trim(),
    dishes,
    calories: (row.CAL_INFO ?? "").trim(),
    allergens: [...codes]
      .sort((a, b) => a - b)
      .map((code) => ({ code, name: ALLERGEN_NAMES[code] ?? `기타 ${code}` })),
    schoolName: (row.SCHUL_NM ?? "").trim(),
  };
}

/** 한국 시간 기준 오늘 날짜 (YYYYMMDD) */
export function kstToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}
