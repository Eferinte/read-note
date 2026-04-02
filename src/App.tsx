import { useEffect, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import StaffSnippet from "./components/StaffSnippet";
import { createSnippet, SNIPPET_LENGTH, type PracticeNote } from "./lib/music";

function badgeClassName(type: "correct" | "wrong" | null): string {
  if (type === "correct") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (type === "wrong") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-500";
}

export default function App() {
  const [snippet, setSnippet] = useState<PracticeNote[]>(() => createSnippet());
  const [activeIndex, setActiveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [lastPressedMidi, setLastPressedMidi] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);

  const accuracy = attempts === 0 ? 0 : Math.round((correctCount / attempts) * 100);
  const currentNote = snippet[activeIndex];

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const startNextRound = () => {
    setSnippet(createSnippet());
    setActiveIndex(0);
    setRound((value) => value + 1);
  };

  const resetTraining = () => {
    setSnippet(createSnippet());
    setActiveIndex(0);
    setScore(0);
    setAttempts(0);
    setCorrectCount(0);
    setStreak(0);
    setRound(1);
    setLastPressedMidi(null);
    setFeedback(null);
  };

  const handleKeyPress = (midi: number) => {
    setLastPressedMidi(midi);
    setAttempts((value) => value + 1);

    if (midi === currentNote.midi) {
      const isRoundFinished = activeIndex === snippet.length - 1;

      setCorrectCount((value) => value + 1);
      setScore((value) => value + 10);
      setStreak((value) => value + 1);
      setFeedback("correct");

      if (isRoundFinished) {
        setScore((value) => value + 20);
        startNextRound();
        return;
      }

      setActiveIndex((value) => value + 1);
      return;
    }

    setScore((value) => Math.max(0, value - 2));
    setStreak(0);
    setFeedback("wrong");
  };

  return (
    <main className="min-h-screen pb-10 text-brand-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:py-10">
        <header className="rounded-2xl bg-brand-deep p-6 text-white shadow-lg shadow-slate-400/25">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">识五线谱练习工具</h1>
          <p className="mt-2 text-sm text-slate-100 sm:text-base">
            阅读上方五线谱，点击下方 88 键钢琴中对应音高。当前目标音符已在谱面中高亮。
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">得分</p>
            <p className="text-2xl font-semibold">{score}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">连击</p>
            <p className="text-2xl font-semibold">{streak}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">准确率</p>
            <p className="text-2xl font-semibold">{accuracy}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
            <p className="text-xs text-slate-500">回合</p>
            <p className="text-2xl font-semibold">{round}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">
                当前进度：第 {activeIndex + 1} / {SNIPPET_LENGTH} 个音符
              </p>
              <p className="text-xs text-slate-500">
                {showHint ? `提示音名：${currentNote.label}` : "提示已隐藏"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName(feedback)}`}>
                {feedback === "correct" ? "正确 +10" : feedback === "wrong" ? "错误 -2" : "等待输入"}
              </span>
              <button
                type="button"
                onClick={() => setShowHint((value) => !value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                {showHint ? "隐藏提示" : "显示提示"}
              </button>
              <button
                type="button"
                onClick={startNextRound}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                下一组
              </button>
              <button
                type="button"
                onClick={resetTraining}
                className="rounded-lg bg-brand-accent px-3 py-1.5 text-sm font-semibold text-white hover:brightness-95"
              >
                重置
              </button>
            </div>
          </div>

          <StaffSnippet notes={snippet} activeIndex={activeIndex} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-lg font-semibold">88 键钢琴</h2>
          <PianoKeyboard
            activeMidi={currentNote.midi}
            lastPressedMidi={lastPressedMidi}
            onKeyPress={handleKeyPress}
          />
        </section>
      </div>
    </main>
  );
}
