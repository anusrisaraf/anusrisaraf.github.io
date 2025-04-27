import React, { useEffect, useRef } from 'react';

export default function LiveMicInput({ inputSource, onAudioData }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (inputSource !== 'mic') return;

    let stopped = false;

    async function startMicCapture() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3.0; // Boost mic sensitivity
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.minDecibels = -100;
        analyser.maxDecibels = -5;
        analyser.smoothingTimeConstant = 0.1; // Lower smoothing for less delay

        source.connect(gainNode);
        gainNode.connect(analyser);
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
        console.error('Microphone capture failed:', err);
        alert('Microphone access denied or not available.');
        onAudioData?.(null);
      }
    }

    startMicCapture();

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
