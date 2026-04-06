import {
  createPianoLayout,
  midiToSharpLabel,
  PIANO_TOTAL_WIDTH,
  type PianoKey,
} from "../lib/music";

type PianoKeyboardProps = {
  activeMidi?: number | null;
  lastPressedMidi?: number | null;
  hoveredMidi?: number | null;
  onKeyPress?: (midi: number) => void;
  onKeyHover?: (midi: number | null) => void;
  showOctaveLabels?: boolean;
  variant?: "default" | "reference";
};

const LAYOUT = createPianoLayout();
const WHITE_KEYS = LAYOUT.filter((key) => !key.isBlack);
const BLACK_KEYS = LAYOUT.filter((key) => key.isBlack);

function keyClassName(
  key: PianoKey,
  activeMidi: number | null,
  lastPressedMidi: number | null,
  hoveredMidi: number | null
): string {
  if (key.midi === hoveredMidi) {
    return key.isBlack ? "bg-sky-500 border-sky-700" : "bg-sky-100 border-sky-400";
  }

  if (key.isBlack) {
    if (key.midi === activeMidi) {
      return "bg-orange-600 border-orange-700";
    }

    if (key.midi === lastPressedMidi) {
      return "bg-slate-500 border-slate-600";
    }

    return "bg-slate-900 border-slate-950 hover:bg-slate-700";
  }

  if (key.midi === activeMidi) {
    return "bg-orange-100 border-orange-300";
  }

  if (key.midi === lastPressedMidi) {
    return "bg-slate-200 border-slate-300";
  }

  return "bg-white border-slate-300 hover:bg-sky-50";
}

function PianoButton({
  keyInfo,
  activeMidi,
  lastPressedMidi,
  hoveredMidi,
  onKeyPress,
  onKeyHover,
  blackHeight = 145,
  showOctaveLabels,
}: {
  keyInfo: PianoKey;
  activeMidi: number | null;
  lastPressedMidi: number | null;
  hoveredMidi: number | null;
  onKeyPress?: (midi: number) => void;
  onKeyHover?: (midi: number | null) => void;
  blackHeight?: number;
  showOctaveLabels: boolean;
}) {
  const label = midiToSharpLabel(keyInfo.midi);
  const isCKey = !keyInfo.isBlack && keyInfo.midi % 12 === 0;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onKeyPress?.(keyInfo.midi)}
      onMouseEnter={() => onKeyHover?.(keyInfo.midi)}
      onMouseLeave={() => onKeyHover?.(null)}
      onFocus={() => onKeyHover?.(keyInfo.midi)}
      onBlur={() => onKeyHover?.(null)}
      className={`absolute border transition-colors ${keyClassName(
        keyInfo,
        activeMidi,
        lastPressedMidi,
        hoveredMidi
      )}`}
      style={{
        left: `${keyInfo.left}px`,
        width: `${keyInfo.width}px`,
        height: keyInfo.isBlack ? `${blackHeight}px` : "230px",
        zIndex: keyInfo.isBlack ? 2 : 1,
        borderRadius: keyInfo.isBlack ? "0 0 4px 4px" : "0 0 6px 6px",
      }}
    >
      {showOctaveLabels && isCKey ? (
        <span className="pointer-events-none absolute bottom-1 text-[10px]">{label}</span>
      ) : null}
    </button>
  );
}

export default function PianoKeyboard({
  activeMidi = null,
  lastPressedMidi = null,
  hoveredMidi = null,
  onKeyPress,
  onKeyHover,
  showOctaveLabels = true,
  variant = "default",
}: PianoKeyboardProps) {
  const wrapperClassName =
    variant === "reference"
      ? "overflow-hidden bg-slate-100/70 shadow-lg shadow-slate-300/35"
      : "w-full overflow-x-auto border border-slate-300 bg-slate-100/60 p-3";

  const stageClassName = variant === "reference" ? "relative h-[230px]" : "relative h-[230px] min-w-max";

  return (
    <div className={wrapperClassName} onMouseLeave={() => onKeyHover?.(null)}>
      <div className={stageClassName} style={{ width: `${PIANO_TOTAL_WIDTH}px` }}>
        {WHITE_KEYS.map((keyInfo) => (
          <PianoButton
            key={keyInfo.midi}
            keyInfo={keyInfo}
            activeMidi={activeMidi}
            lastPressedMidi={lastPressedMidi}
            hoveredMidi={hoveredMidi}
            onKeyPress={onKeyPress}
            onKeyHover={onKeyHover}
            showOctaveLabels={showOctaveLabels}
          />
        ))}
        {BLACK_KEYS.map((keyInfo) => (
          <PianoButton
            key={keyInfo.midi}
            keyInfo={keyInfo}
            activeMidi={activeMidi}
            lastPressedMidi={lastPressedMidi}
            hoveredMidi={hoveredMidi}
            onKeyPress={onKeyPress}
            onKeyHover={onKeyHover}
            showOctaveLabels={showOctaveLabels}
          />
        ))}
      </div>
    </div>
  );
}
