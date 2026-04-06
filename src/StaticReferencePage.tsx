import { useEffect, useRef, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import StaffReference, { STAFF_REFERENCE_HEIGHT } from "./components/StaffReference";
import { PIANO_TOTAL_WIDTH } from "./lib/music";
import { createPianoAudioEngine, type PianoAudioEngine } from "./lib/pianoAudio";

const KEYBOARD_HEIGHT = 230;
const LAYOUT_GAP = 18;
const STATIC_REFERENCE_HEIGHT = STAFF_REFERENCE_HEIGHT + LAYOUT_GAP + KEYBOARD_HEIGHT;

export default function StaticReferencePage() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pianoAudioRef = useRef<PianoAudioEngine | null>(null);
  const [hoveredMidi, setHoveredMidi] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState({ height: STATIC_REFERENCE_HEIGHT, width: PIANO_TOTAL_WIDTH });

  useEffect(() => {
    pianoAudioRef.current = createPianoAudioEngine();

    return () => {
      pianoAudioRef.current?.dispose();
      pianoAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setFrameSize({
        height: Math.max(320, Math.floor(entry.contentRect.height)),
        width: Math.max(320, Math.floor(entry.contentRect.width)),
      });
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(
    1,
    frameSize.width / PIANO_TOTAL_WIDTH,
    frameSize.height / STATIC_REFERENCE_HEIGHT
  );

  const handleKeyPress = (midi: number) => {
    setHoveredMidi(midi);
    pianoAudioRef.current?.playNote(midi);
  };

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#d9ecff_0%,_#eef5ff_38%,_#f4f7fb_100%)] text-brand-deep">
      <div ref={frameRef} className="flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-6">
        <div
          style={{
            height: `${STATIC_REFERENCE_HEIGHT * scale}px`,
            width: `${PIANO_TOTAL_WIDTH * scale}px`,
          }}
        >
          <div
            className="flex flex-col gap-[18px]"
            style={{
              height: `${STATIC_REFERENCE_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: `${PIANO_TOTAL_WIDTH}px`,
            }}
          >
            <StaffReference hoveredMidi={hoveredMidi} onHoverChange={setHoveredMidi} />
            <PianoKeyboard
              hoveredMidi={hoveredMidi}
              onKeyHover={setHoveredMidi}
              onKeyPress={handleKeyPress}
              showOctaveLabels={false}
              variant="reference"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
