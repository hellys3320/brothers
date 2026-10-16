export default function HyungnimTalk({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border-4 border-amber-300 bg-white p-4 shadow">
      <div className="text-5xl" aria-hidden>
        🕵️
      </div>
      <div className="flex-1">
        <p className="font-bold">형님 왈:</p>
        <p className="text-xl">{text}</p>
      </div>
    </div>
  );
}
