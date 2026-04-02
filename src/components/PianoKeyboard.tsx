import {
  createPianoLayout,
  midiToSharpLabel,
  PIANO_TOTAL_WIDTH,
  type PianoKey,
} from "../lib/music";

type PianoKeyboardProps = {
  activeMidi: number;
  lastPressedMidi: number | null;
  onKeyPress: (midi: number) => void;
};

const LAYOUT = createPianoLayout();
const WHITE_KEYS = LAYOUT.filter((key) => !key.isBlack);
const BLACK_KEYS = LAYOUT.filter((key) => key.isBlack);

function keyClassName(key: PianoKey, activeMidi: number, lastPressedMidi: number | null): string {
  if (key.isBlack) {
    if (key.midi === activeMidi) {
      return "bg-orange-600";
    }

    if (key.midi === lastPressedMidi) {
      return "bg-slate-500";
    }

    return "bg-slate-900 hover:bg-slate-700";
  }

  if (key.midi === activeMidi) {
    return "bg-orange-100";
  }

  if (key.midi === lastPressedMidi) {
    return "bg-slate-200";
  }

  return "bg-white hover:bg-sky-50";
}

function PianoButton({
  keyInfo,
  activeMidi,
  lastPressedMidi,
  onKeyPress,
  blackHeight = 145,
}: {
  keyInfo: PianoKey;
  activeMidi: number;
  lastPressedMidi: number | null;
  onKeyPress: (midi: number) => void;
  blackHeight?: number;
}) {
  const label = midiToSharpLabel(keyInfo.midi);
  const isCKey = !keyInfo.isBlack && keyInfo.midi % 12 === 0;

  return (
    <button
      type="button"
      aria-label={`钢琴键 ${label}`}
      onClick={() => onKeyPress(keyInfo.midi)}
      className={`absolute border border-slate-300 transition-colors ${keyClassName(
        keyInfo,
        activeMidi,
        lastPressedMidi
      )}`}
      style={{
        left: `${keyInfo.left}px`,
        width: `${keyInfo.width}px`,
        height: keyInfo.isBlack ? `${blackHeight}px` : "230px",
        zIndex: keyInfo.isBlack ? 2 : 1,
        borderRadius: keyInfo.isBlack ? "0 0 4px 4px" : "0 0 6px 6px",
      }}
    >
      {isCKey ? <span className="pointer-events-none absolute bottom-1 text-[10px]">{label}</span> : null}
    </button>
  );
}

export default function PianoKeyboard({ activeMidi, lastPressedMidi, onKeyPress }: PianoKeyboardProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-300 bg-slate-100/60 p-3">
      <div className="relative h-[230px] min-w-max" style={{ width: `${PIANO_TOTAL_WIDTH}px` }}>
        {WHITE_KEYS.map((keyInfo) => (
          <PianoButton
            key={keyInfo.midi}
            keyInfo={keyInfo}
            activeMidi={activeMidi}
            lastPressedMidi={lastPressedMidi}
            onKeyPress={onKeyPress}
          />
        ))}
        {BLACK_KEYS.map((keyInfo) => (
          <PianoButton
            key={keyInfo.midi}
            keyInfo={keyInfo}
            activeMidi={activeMidi}
            lastPressedMidi={lastPressedMidi}
            onKeyPress={onKeyPress}
          />
        ))}
      </div>
    </div>
  );
}
