import { useEffect, useRef, useState } from "react";
import type { PracticeNote } from "../lib/music";

type StaffSnippetProps = {
  notes: PracticeNote[];
  activeIndex: number;
};

export default function StaffSnippet({ notes, activeIndex }: StaffSnippetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [staffWidth, setStaffWidth] = useState(560);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.max(520, Math.floor(entries[0].contentRect.width));
      setStaffWidth(nextWidth);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isCancelled = false;

    const draw = async () => {
      const { Formatter, Renderer, Stave, StaveNote } = await import("vexflow");
      if (isCancelled) {
        return;
      }

      container.innerHTML = "";

      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(staffWidth, 220);
      const context = renderer.getContext();

      const stave = new Stave(10, 55, staffWidth - 20);
      stave.addClef("treble");
      stave.addTimeSignature("4/4");
      stave.setContext(context).draw();

      const vexNotes = notes.map((note, index) => {
        const staveNote = new StaveNote({
          clef: "treble",
          keys: [note.vexKey],
          duration: "q",
        });

        if (index === activeIndex) {
          staveNote.setStyle({ fillStyle: "#FFbbff", strokeStyle: "#FFbbff" });
        }

        return staveNote;
      });

      Formatter.FormatAndDraw(context, stave, vexNotes);
    };

    void draw();

    return () => {
      isCancelled = true;
    };
  }, [activeIndex, notes, staffWidth]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm">
      <div ref={containerRef} className="w-full overflow-hidden" />
    </div>
  );
}
