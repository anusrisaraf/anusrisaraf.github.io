import React, { useEffect, useRef } from 'react';

export default function LiveAudioInput({ inputSource, onAudioData }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (inputSource !== 'device') return;

    let stopped = false;

    async function startSystemAudioCapture() {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: false, audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.minDecibels = -100;
        analyser.maxDecibels = -5;
        analyser.smoothingTimeConstant = 0.6;

        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const tick = () => {
          if (stopped) return;
          analyser.getByteFrequencyData(dataArray);
          onAudioData?.([...dataArray]);
          animationRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error('Error capturing system audio:', err);
        alert('System audio capture failed. Please allow access or try a different browser.');
        onAudioData?.(null);
      }
    }

    startSystemAudioCapture();

    return () => {
      stopped = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [inputSource, onAudioData]);

  return null;
}
