import { useEffect, useRef } from "react";
import {
  createPianoLayout,
  midiToSharpLabel,
  PIANO_TOTAL_WIDTH,
  type PianoKey,
} from "../lib/music";

type StaffReferenceProps = {
  hoveredMidi: number | null;
  onHoverChange: (midi: number | null) => void;
};

type StaffReferenceNote = {
  accidental: "#" | null;
  midi: number;
  step: number;
  x: number;
  y: number;
};

const LETTER_TO_STEP_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const LAYOUT = createPianoLayout();
const STEP_HEIGHT = 6;
const TOP_STEP = 57;
const BOTTOM_STEP = 4;
const TOP_PADDING = 18;
const BOTTOM_PADDING = 18;
const NOTE_HEAD_RX = 7.6;
const NOTE_HEAD_RY = 5.4;
const CLEF_STAVE_X = 6;
const CLEF_STAVE_WIDTH = 56;

export const STAFF_REFERENCE_HEIGHT = TOP_PADDING + (TOP_STEP - BOTTOM_STEP) * STEP_HEIGHT + BOTTOM_PADDING;

function midiToStep(midi: number): { accidental: "#" | null; step: number } {
  const sharpLabel = midiToSharpLabel(midi);
  const letter = sharpLabel[0];
  const accidental = sharpLabel.includes("#") ? "#" : null;
  const octave = Number.parseInt(sharpLabel.slice(accidental ? 2 : 1), 10);

  return {
    accidental,
    step: octave * 7 + LETTER_TO_STEP_INDEX[letter],
  };
}

function stepToY(step: number): number {
  return TOP_PADDING + (TOP_STEP - step) * STEP_HEIGHT;
}

function noteToReference(keyInfo: PianoKey): StaffReferenceNote {
  const { accidental, step } = midiToStep(keyInfo.midi);

  return {
    accidental,
    midi: keyInfo.midi,
    step,
    x: keyInfo.left + keyInfo.width / 2,
    y: stepToY(step),
  };
}

function ledgerSteps(step: number): number[] {
  if (step > 38) {
    const upperBound = step % 2 === 0 ? step : step - 1;
    return Array.from({ length: Math.max(0, (upperBound - 40) / 2 + 1) }, (_, index) => 40 + index * 2);
  }

  if (step < 18) {
    const lowerBound = step % 2 === 0 ? step : step + 1;
    if (lowerBound > 16) {
      return [];
    }

    return Array.from({ length: (16 - lowerBound) / 2 + 1 }, (_, index) => lowerBound + index * 2);
  }

  return step === 28 ? [28] : [];
}

const NOTES = LAYOUT.map(noteToReference);
const STAFF_LINE_STEPS = [18, 20, 22, 24, 26, 30, 32, 34, 36, 38];

export default function StaffReference({ hoveredMidi, onHoverChange }: StaffReferenceProps) {
  const clefLayerRef = useRef<HTMLDivElement | null>(null);
  const hoveredNote = hoveredMidi === null ? null : NOTES.find((note) => note.midi === hoveredMidi) ?? null;

  useEffect(() => {
    const container = clefLayerRef.current;
    if (!container) {
      return;
    }

    let isCancelled = false;

    const drawClefs = async () => {
      const { Renderer, Stave } = await import("vexflow");
      if (isCancelled) {
        return;
      }

      container.innerHTML = "";

      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(PIANO_TOTAL_WIDTH, STAFF_REFERENCE_HEIGHT);
      const context = renderer.getContext();

      const staveOptions = {
        leftBar: false,
        rightBar: false,
        spaceAboveStaffLn: 0,
        spaceBelowStaffLn: 0,
        spacingBetweenLinesPx: STEP_HEIGHT * 2,
      };

      const trebleStave = new Stave(CLEF_STAVE_X, stepToY(38), CLEF_STAVE_WIDTH, staveOptions);
      trebleStave.setConfigForLines(Array.from({ length: 5 }, () => ({ visible: false })));
      trebleStave.addClef("treble");
      trebleStave.setContext(context).draw();

      const bassStave = new Stave(CLEF_STAVE_X, stepToY(26), CLEF_STAVE_WIDTH, staveOptions);
      bassStave.setConfigForLines(Array.from({ length: 5 }, () => ({ visible: false })));
      bassStave.addClef("bass");
      bassStave.setContext(context).draw();
    };

    void drawClefs();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-white/92 shadow-lg shadow-slate-300/35">
      <div ref={clefLayerRef} className="pointer-events-none absolute inset-0 z-10" />
      <svg
        viewBox={`0 0 ${PIANO_TOTAL_WIDTH} ${STAFF_REFERENCE_HEIGHT}`}
        className="relative z-[2] block w-full"
        onMouseLeave={() => onHoverChange(null)}
        role="img"
        aria-label="钢琴键与五线谱位置对应图"
      >
        <rect x="0" y="0" width={PIANO_TOTAL_WIDTH} height={STAFF_REFERENCE_HEIGHT} fill="rgba(255,255,255,0.98)" />
        {hoveredNote ? (
          <line
            x1={hoveredNote.x}
            y1={0}
            x2={hoveredNote.x}
            y2={STAFF_REFERENCE_HEIGHT}
            stroke="rgba(249,115,22,0.28)"
            strokeDasharray="6 6"
            strokeWidth="2"
          />
        ) : null}

        {STAFF_LINE_STEPS.map((step) => (
          <line
            key={step}
            x1="0"
            y1={stepToY(step)}
            x2={PIANO_TOTAL_WIDTH}
            y2={stepToY(step)}
            stroke="rgba(51,65,85,0.55)"
            strokeWidth="1.2"
          />
        ))}

        {hoveredNote
          ? ledgerSteps(hoveredNote.step).map((step) => (
              <line
                key={`ledger-${step}`}
                x1={hoveredNote.x - 15}
                y1={stepToY(step)}
                x2={hoveredNote.x + 15}
                y2={stepToY(step)}
                stroke="rgba(249,115,22,0.9)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ))
          : null}

        {NOTES.map((note) => {
          const isHovered = note.midi === hoveredMidi;
          const noteFill = isHovered ? "#000" : "rgba(15,23,42,0.34)";
          const noteStroke = isHovered ? "#000" : "rgba(15,23,42,0.12)";
          const accidentalFill = isHovered ? "#000" : "rgba(15,23,42,0.5)";

          if (!isHovered) {
            return null;
          }

          return (
            <g
              key={note.midi}
              onMouseEnter={() => onHoverChange(note.midi)}
              style={{ cursor: "pointer" }}
            >
              <rect x={note.x - 9} y={note.y - 13} width="18" height="26" fill="transparent" />
              {note.accidental ? (
                <text
                  x={note.x - 13}
                  y={note.y + 4}
                  fontSize="13"
                  fontWeight="700"
                  fill={accidentalFill}
                  pointerEvents="none"
                >
                  #
                </text>
              ) : null}
              <ellipse
                cx={note.x}
                cy={note.y}
                rx={isHovered ? NOTE_HEAD_RX + 0.8 : NOTE_HEAD_RX}
                ry={isHovered ? NOTE_HEAD_RY + 0.6 : NOTE_HEAD_RY}
                fill={noteFill}
                stroke={noteStroke}
                strokeWidth={isHovered ? "1.8" : "1.2"}
                transform={`rotate(-18 ${note.x} ${note.y})`}
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
