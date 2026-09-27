"use client";

import React, { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  stream?: MediaStream | null | undefined;
  isMuted?: boolean | undefined;
  isConnected?: boolean | undefined;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stream,
  isMuted = false,
  isConnected = false,
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>([
    0.2, 0.3, 0.6, 0.9, 0.6, 0.3, 0.2,
  ]);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isConnected || isMuted || !stream) {
      setAudioLevels([0.15, 0.25, 0.4, 0.6, 0.4, 0.25, 0.15]);
      return () => {};
    }

    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return () => {};
      }

      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        analyser.getByteFrequencyData(dataArray);

        // Pick 9 frequency bars for visualizer symmetry
        const barIndices = [2, 4, 6, 8, 10, 8, 6, 4, 2];
        const newLevels = barIndices.map((idx) => {
          const val = dataArray[idx] || 0;
          return Math.max(0.15, Math.min(1.0, val / 255));
        });

        setAudioLevels(newLevels);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          try {
            audioCtxRef.current.close();
          } catch {}
        }
      };
    } catch (err) {
      console.warn("AudioVisualizer AudioContext notice:", err);
      return () => {};
    }
  }, [stream, isMuted, isConnected]);

  return (
    <div
      aria-label="Live audio visualizer"
      className="flex items-center justify-center gap-1.5 my-5 h-10 select-none"
    >
      {audioLevels.map((level, index) => (
        <span
          key={index}
          className={`w-1.5 sm:w-2 rounded-full transition-all duration-100 ${
            isMuted
              ? "bg-slate-600 opacity-40"
              : isConnected
              ? "bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
              : "bg-emerald-500/50 animate-pulse"
          }`}
          style={{
            height: isMuted ? "6px" : `${Math.max(8, level * 38)}px`,
          }}
        />
      ))}
    </div>
  );
};
