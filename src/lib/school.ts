// 학교·급식 정보 (로그인 없이 이 기기에만 저장)
export interface SchoolInfo {
  /** 시도교육청코드 (NEIS ATPT_OFCDC_SC_CODE) */
  officeCode: string;
  officeName: string;
  /** 행정표준코드 (NEIS SD_SCHUL_CODE) */
  schoolCode: string;
  name: string;
  kind: string;
  address: string;
  location?: string;
}

export interface MealAllergen {
  code: number;
  name: string;
}

export interface MealInfo {
  /** YYYYMMDD */
  date: string;
  mealName: string;
  dishes: string[];
  calories: string;
  allergens: MealAllergen[];
  schoolName: string;
}

export interface SchoolSearchResponse {
  ok: boolean;
  items?: SchoolInfo[];
  reason?: string;
}

export interface MealResponse {
  ok: boolean;
  meal?: MealInfo;
  reason?: string;
  date?: string;
}

export async function searchSchools(query: string): Promise<SchoolInfo[]> {
  const q = query.trim();
  if (!q) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`/api/school/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as SchoolSearchResponse;
    return data.ok && Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTodayMeal(school: SchoolInfo, date?: string): Promise<MealResponse> {
  const params = new URLSearchParams({
    office: school.officeCode,
    school: school.schoolCode,
  });
  if (date) params.set("date", date);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`/api/school/meal?${params.toString()}`, { signal: ctrl.signal });
    if (!res.ok && res.status >= 500) return { ok: false, reason: "fetch-fail" };
    return (await res.json()) as MealResponse;
  } catch {
    return { ok: false, reason: "fetch-fail" };
  } finally {
    clearTimeout(timer);
  }
}
