// 형님 우체통: 날짜별 편지 1통 (재방문 이유). mission이 있으면 인증 시 +5 XP.
export interface Letter {
  text: string;
  mission?: string;
}

const LETTERS: Letter[] = [
  { text: "오늘 비밀이 하나 숨겨졌대! 동네탐험 가봐!" },
  { text: "빵집 냄새를 맡으면 행운이 온대! 진짜야!", mission: "오늘 빵 냄새 맡기!" },
  { text: "도서관에서 가장 두꺼운 책을 찾아봐! 몇 쪽일까?", mission: "도서관 책 1권 펼치기!" },
  { text: "횡단보도에서 손을 제일 높이 든 사람이 이기는 거야!", mission: "오늘 손 들고 건너기!" },
  { text: "오늘 만난 어른께 인사하면 XP 100점짜리 기분!" },
  { text: "공원 벤치에 앉아 1분만 눈 감아봐. 소리가 보여!", mission: "눈 감고 소리 듣기!" },
  { text: "네 꿈을 아무에게나 말하면 이루어진대! (형님 제외)" },
  { text: "소방서는 빨간색이야. 빨간색 물건 3개 찾아봐!", mission: "빨간색 물건 3개 찾기!" },
  { text: "오늘의 운세: 도서관에서 좋은 일이 생김!" },
  { text: "약국 십자가가 초록색인 이유를 맞혀봐!" },
  { text: "우체통을 본 사람은 행운! (지금 보고 있잖아!)" },
  { text: "형님도 어릴 땐 탐험대원이었어. 비밀인데!" },
  { text: "비가 오면 지렁이가 이사해. 같이 응원해줘!", mission: "밖에 나가 흙 냄새 맡기!" },
  { text: "오늘 본 것 중 제일 웃긴 걸 일기에 써봐!", mission: "일기 한 줄 쓰기!" },
];

function seedOf(date: Date): number {
  return date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
}

export function getDailyLetter(date = new Date()): string {
  return LETTERS[seedOf(date) % LETTERS.length].text;
}

export function getDailyMission(date = new Date()): string | null {
  return LETTERS[seedOf(date) % LETTERS.length].mission ?? null;
}

const DONE_KEY = "brothers-letter-done";

export function letterDoneToday(date = new Date()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DONE_KEY) === date.toDateString();
  } catch {
    return false;
  }
}

export function markLetterDone(date = new Date()) {
  try {
    localStorage.setItem(DONE_KEY, date.toDateString());
  } catch {}
}
