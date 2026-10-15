// 상가(상권)정보 연결용. 지금은 목업, 나중에 공공데이터포털 실API로 교체.
// 실API: 소상공인시장진흥공단 상가(상권)정보 API (키: DATA_GO_KR_KEY)

export interface Shop {
  id: string;
  name: string;
  jobCode: string;
  dong: string;
  address: string;
  easy: string;
}

export const MOCK_SHOPS: Shop[] = [
  { id: "s1", name: "햇살 빵집", jobCode: "baker", dong: "햇살동", address: "햇살로 10", easy: "크루아상이 제일 맛있어!" },
  { id: "s2", name: "달님 빵집", jobCode: "baker", dong: "햇살동", address: "햇살로 25", easy: "식빵이 부드러워!" },
  { id: "s3", name: "별별 분식 (빵도 팔아요)", jobCode: "baker", dong: "햇살동", address: "햇살로 31", easy: "단팥빵이 있어!" },
  { id: "s4", name: "튼튼 병원", jobCode: "nurse", dong: "햇살동", address: "햇살로 12", easy: "간호사 누나가 있어!" },
  { id: "s5", name: "햇살 도서관 만화코너", jobCode: "toon", dong: "햇살동", address: "햇살로 5", easy: "웹툰책이 500권!" },
  { id: "s6", name: "햇살 소방서", jobCode: "fire", dong: "햇살동", address: "햇살로 1", easy: "소방관 형님이 있어!" },
  { id: "s7", name: "다람쥐 공원 드론교실", jobCode: "drone", dong: "햇살동", address: "공원 안", easy: "토요일에 날려봐!" },
  { id: "s8", name: "햇살 도서관", jobCode: "librarian", dong: "햇살동", address: "햇살로 5", easy: "사서 선생님이 책 찾아줘!" },
];

export function getShopsByJob(jobCode: string): Shop[] {
  return MOCK_SHOPS.filter((s) => s.jobCode === jobCode);
}

export function countShopsByJob(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of MOCK_SHOPS) m[s.jobCode] = (m[s.jobCode] ?? 0) + 1;
  return m;
}
