export type FacilityKind = "도서관" | "공원" | "병원" | "안전지킴이집" | "주의길";

export interface TownFacility {
  id: string;
  name: string;
  kind: FacilityKind;
  dong: string;
  easy: string;
  stamp: string;
  safeLevel: "초록" | "노랑" | "빨강";
  lat: number;
  lng: number;
}

export interface JobCard {
  code: string;
  name: string;
  emoji: string;
  easy3: string[];
  powers: { 힘: number; 말하기: number; 그리기: number };
  townPlace: string;
  source: string;
}

export interface QuizItem {
  id: string;
  q: string;
  choices: string[];
  answer: number;
  say: string;
}

export const MOCK_TOWN: TownFacility[] = [
  { id: "lib-1", name: "햇살 도서관", kind: "도서관", dong: "햇살동", easy: "책 3만 권! 어린이 책 코너가 제일 커요.", stamp: "📚", safeLevel: "초록", lat: 37.5678, lng: 126.9785 },
  { id: "park-1", name: "다람쥐 공원", kind: "공원", dong: "햇살동", easy: "미끄럼틀이 3개! 운동장 1개만큼 커요.", stamp: "🌳", safeLevel: "초록", lat: 37.5658, lng: 126.9805 },
  { id: "hosp-1", name: "튼튼 병원", kind: "병원", dong: "햇살동", easy: "감기에 걸리면 여기로 가요.", stamp: "🏥", safeLevel: "초록", lat: 37.5668, lng: 126.9765 },
  { id: "safe-1", name: "안전지킴이 문구점", kind: "안전지킴이집", dong: "햇살동", easy: "위험할 때 들어가서 도와달라고 말해요.", stamp: "🛟", safeLevel: "초록", lat: 37.5673, lng: 126.9795 },
  { id: "road-1", name: "학교 앞 큰길", kind: "주의길", dong: "햇살동", easy: "차가 빨라요. 꼭 손 들고 건너요.", stamp: "⚠️", safeLevel: "노랑", lat: 37.5655, lng: 126.9775 },
];

export const MOCK_JOBS: JobCard[] = [
  { code: "fire", name: "소방관", emoji: "🚒", easy3: ["불을 꺼요", "사람을 구해요", "몸이 튼튼해야 해요"], powers: { 힘: 5, 말하기: 3, 그리기: 1 }, townPlace: "햇살 소방서", source: "나라 직업 조사 + 안전 이야기" },
  { code: "nurse", name: "간호사", emoji: "💉", easy3: ["아픈 사람을 돌봐요", "주사를 놓아요", "마음이 따뜻해요"], powers: { 힘: 3, 말하기: 5, 그리기: 1 }, townPlace: "튼튼 병원", source: "나라 병원 직업 이야기" },
  { code: "baker", name: "제빵사", emoji: "🍞", easy3: ["새벽에 빵을 구워요", "밀가루 냄새가 나요", "손이 빨라요"], powers: { 힘: 3, 말하기: 2, 그리기: 4 }, townPlace: "골목 빵집 5곳", source: "우리동네 빵집 이야기" },
  { code: "toon", name: "웹툰작가", emoji: "✏️", easy3: ["그림으로 이야기를 만들어요", "마감과 싸워요", "상상이 풍부해요"], powers: { 힘: 1, 말하기: 3, 그리기: 5 }, townPlace: "햇살 도서관 만화코너", source: "나라 그림 직업 이야기" },
  { code: "drone", name: "드론조종사", emoji: "🛸", easy3: ["하늘에서 사진을 찍어요", "농사도 도와줘요", "조종이 능숙해요"], powers: { 힘: 2, 말하기: 2, 그리기: 3 }, townPlace: "다람쥐 공원 드론교실", source: "새로 생긴 직업 이야기" },
  { code: "librarian", name: "사서", emoji: "📖", easy3: ["책을 찾아줘요", "독서수업을 해요", "조용히 도와줘요"], powers: { 힘: 1, 말하기: 4, 그리기: 2 }, townPlace: "햇살 도서관", source: "도서관 직업 이야기" },
];

export const MOCK_QUIZ: QuizItem[] = [
  { id: "q1", q: "위험할 때 들어갈 수 있는 곳은?", choices: ["안전지킴이집", "깜깜한 골목", "차도 한가운데"], answer: 0, say: "정답! 노란 스티커가 붙은 가게로 들어가!" },
  { id: "q2", q: "미세먼지 나쁨! 무엇을 할까?", choices: ["마스크 쓰기", "창문 활짝 열기", "운동장에서 오래 놀기"], answer: 0, say: "맞아! 마스크는 비밀방패야." },
  { id: "q3", q: "빵을 만드는 직업은?", choices: ["제빵사", "소방관", "드론조종사"], answer: 0, say: "정답! 새벽 5시에 빵 굽는 형님이야." },
];
