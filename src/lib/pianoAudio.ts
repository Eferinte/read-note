export type PianoAudioEngine = {
  playNote: (midi: number) => void;
  dispose: () => void;
};

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const MIN_ENVELOPE_GAIN = 0.0001;
const NOISE_DURATION = 0.03;

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as AudioContextWindow;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

export function createPianoAudioEngine(): PianoAudioEngine {
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;

  const ensureContext = (): AudioContext | null => {
    if (context) {
      return context;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      return null;
    }

    context = new AudioContextConstructor();
    masterGain = context.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(context.destination);
    return context;
  };

  const ensureNoiseBuffer = (audioContext: AudioContext): AudioBuffer => {
    if (noiseBuffer && noiseBuffer.sampleRate === audioContext.sampleRate) {
      return noiseBuffer;
    }

    const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * NOISE_DURATION));
    noiseBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return noiseBuffer;
  };

  return {
    playNote(midi) {
      const audioContext = ensureContext();
      if (!audioContext || !masterGain) {
        return;
      }

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const now = audioContext.currentTime;
      const frequency = midiToFrequency(midi);
      const decayDuration = Math.max(0.9, 2.2 - (midi - 21) * 0.012);

      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(12000, frequency * 7), now);
      filter.Q.setValueAtTime(0.7, now);

      const noteGain = audioContext.createGain();
      noteGain.gain.setValueAtTime(MIN_ENVELOPE_GAIN, now);
      noteGain.gain.exponentialRampToValueAtTime(0.32, now + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(MIN_ENVELOPE_GAIN, now + decayDuration);

      filter.connect(noteGain);
      noteGain.connect(masterGain);

      const partials: ReadonlyArray<{
        detune: number;
        gain: number;
        ratio: number;
        type: OscillatorType;
      }> = [
        { detune: 0, gain: 0.9, ratio: 1, type: "triangle" },
        { detune: -5, gain: 0.32, ratio: 2, type: "sine" },
        { detune: 4, gain: 0.18, ratio: 3, type: "sine" },
      ];

      partials.forEach((partial) => {
        const oscillator = audioContext.createOscillator();
        const partialGain = audioContext.createGain();

        oscillator.type = partial.type;
        oscillator.frequency.setValueAtTime(frequency * partial.ratio, now);
        oscillator.detune.setValueAtTime(partial.detune, now);

        partialGain.gain.setValueAtTime(partial.gain, now);
        partialGain.gain.exponentialRampToValueAtTime(MIN_ENVELOPE_GAIN, now + decayDuration * 0.65);

        oscillator.connect(partialGain);
        partialGain.connect(filter);

        oscillator.start(now);
        oscillator.stop(now + decayDuration);
        oscillator.onended = () => {
          oscillator.disconnect();
          partialGain.disconnect();
        };
      });

      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = ensureNoiseBuffer(audioContext);

      const noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(Math.min(9000, frequency * 2.4), now);
      noiseFilter.Q.setValueAtTime(0.5, now);

      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.025, now);
      noiseGain.gain.exponentialRampToValueAtTime(MIN_ENVELOPE_GAIN, now + NOISE_DURATION);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(filter);
      noiseSource.start(now);
      noiseSource.stop(now + NOISE_DURATION);
      noiseSource.onended = () => {
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
      };

      window.setTimeout(() => {
        filter.disconnect();
        noteGain.disconnect();
      }, (decayDuration + 0.1) * 1000);
    },

    dispose() {
      if (masterGain) {
        masterGain.disconnect();
        masterGain = null;
      }

      if (context) {
        void context.close();
        context = null;
      }

      noiseBuffer = null;
    },
  };
}
