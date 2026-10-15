"use client";

export function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    // 조용히 무시 (초등 태블릿 대응)
  }
}
