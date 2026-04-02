export type PracticeNote = {
  midi: number;
  label: string;
  vexKey: string;
};

export type PianoKey = {
  midi: number;
  isBlack: boolean;
  left: number;
  width: number;
};

const NATURAL_PITCH_CLASSES: Record<number, string> = {
  0: "C",
  2: "D",
  4: "E",
  5: "F",
  7: "G",
  9: "A",
  11: "B",
};

const SHARP_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

const MIN_PRACTICE_MIDI = 60; // C4
const MAX_PRACTICE_MIDI = 83; // B5

export const SNIPPET_LENGTH = 4;
export const PIANO_LOW_MIDI = 21;
export const PIANO_HIGH_MIDI = 108;
export const WHITE_KEY_WIDTH = 24;
export const BLACK_KEY_WIDTH = 14;
export const WHITE_KEY_COUNT = 52;
export const PIANO_TOTAL_WIDTH = WHITE_KEY_WIDTH * WHITE_KEY_COUNT;

const PRACTICE_POOL = Array.from(
  { length: MAX_PRACTICE_MIDI - MIN_PRACTICE_MIDI + 1 },
  (_, index) => MIN_PRACTICE_MIDI + index
).filter((midi) => NATURAL_PITCH_CLASSES[midi % 12] !== undefined);

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(midi % 12);
}

export function midiToSharpLabel(midi: number): string {
  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${SHARP_LABELS[pitchClass]}${octave}`;
}

function midiToNaturalKey(midi: number): { letter: string; octave: number } {
  const pitchClass = midi % 12;
  const letter = NATURAL_PITCH_CLASSES[pitchClass];

  if (!letter) {
    throw new Error(`仅支持自然音训练，收到 MIDI ${midi}`);
  }

  const octave = Math.floor(midi / 12) - 1;
  return { letter, octave };
}

function toPracticeNote(midi: number): PracticeNote {
  const { letter, octave } = midiToNaturalKey(midi);
  return {
    midi,
    label: `${letter}${octave}`,
    vexKey: `${letter.toLowerCase()}/${octave}`,
  };
}

export function createSnippet(length: number = SNIPPET_LENGTH): PracticeNote[] {
  const snippet: PracticeNote[] = [];

  for (let index = 0; index < length; index += 1) {
    let midi = PRACTICE_POOL[Math.floor(Math.random() * PRACTICE_POOL.length)];
    while (snippet.length > 0 && snippet[snippet.length - 1].midi === midi) {
      midi = PRACTICE_POOL[Math.floor(Math.random() * PRACTICE_POOL.length)];
    }

    snippet.push(toPracticeNote(midi));
  }

  return snippet;
}

export function createPianoLayout(): PianoKey[] {
  const keys: PianoKey[] = [];
  let whiteIndex = 0;

  for (let midi = PIANO_LOW_MIDI; midi <= PIANO_HIGH_MIDI; midi += 1) {
    const black = isBlackKey(midi);

    if (black) {
      keys.push({
        midi,
        isBlack: true,
        left: whiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
        width: BLACK_KEY_WIDTH,
      });
      continue;
    }

    keys.push({
      midi,
      isBlack: false,
      left: whiteIndex * WHITE_KEY_WIDTH,
      width: WHITE_KEY_WIDTH,
    });
    whiteIndex += 1;
  }

  return keys;
}
