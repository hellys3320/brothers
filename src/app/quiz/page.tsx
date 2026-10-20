import { redirect } from "next/navigation";

export const metadata = {
  title: "오늘의 퀴즈 - 형님의 비밀기지",
};

// 퀴즈는 게임 놀이터로 통합됐다. 예전 링크·즐겨찾기는 퀴즈 탭으로 보낸다.
export default function QuizPage() {
  redirect("/games?tab=quiz");
}
