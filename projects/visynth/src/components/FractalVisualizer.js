import React, { useRef, useEffect } from 'react';

/**
 * FractalVisualizer
 * A music visualizer that draws fractal patterns generatively in response to audio data.
 * Props:
 *   - audioData: Uint8Array (frequency or time domain data from an analyser node)
 *   - width: number (canvas width)
 *   - height: number (canvas height)
 */
const FractalVisualizer = ({ audioData, width = 600, height = 600 }) => {
  const canvasRef = useRef(null);

  // Draw a fractal flower with dancing petals
const drawFractalFlower = (ctx, cx, cy, baseRadius, numPetals, audioMod, time, maxDepth = 4) => {
  for (let p = 0; p < numPetals; p++) {
    const angle = (2 * Math.PI * p) / numPetals + Math.sin(time / 700 + p) * 0.2 * (audioMod / 128);
    const petalColor = `hsl(${(angle * 180 / Math.PI + 180 + audioMod * 2) % 360}, 80%, 60%)`;
    drawFractalPetal(ctx, cx, cy, baseRadius, angle, 0, maxDepth, petalColor, audioMod, time, p);
  }
};

// Recursive fractal petal
const drawFractalPetal = (ctx, x, y, length, angle, depth, maxDepth, color, audioMod, time, petalIndex) => {
  if (depth > maxDepth || length < 2) return;
  const sway = Math.sin(time / (300 + petalIndex * 40) + depth + petalIndex) * (audioMod / 80) * (maxDepth - depth);
  const nextAngle = angle + sway;
  const x2 = x + length * Math.cos(nextAngle);
  const y2 = y + length * Math.sin(nextAngle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 5 - depth);
  ctx.shadowBlur = 12 - depth * 2;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Recursively draw smaller branches (fractal)
  drawFractalPetal(ctx, x2, y2, length * (0.68 + audioMod * 0.001), nextAngle - 0.25, depth + 1, maxDepth, color, audioMod, time, petalIndex);
  drawFractalPetal(ctx, x2, y2, length * (0.68 + audioMod * 0.001), nextAngle + 0.25, depth + 1, maxDepth, color, audioMod, time, petalIndex);
};

  // Store the latest audioData in a ref
  const audioDataRef = useRef(audioData);
  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let running = true;

    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      // Use the latest audioData
      let audioMod = 0;
      const latestAudio = audioDataRef.current;
      if (latestAudio && latestAudio.length > 0) {
        audioMod = latestAudio.reduce((a, b) => a + b, 0) / latestAudio.length;
      }
      const time = Date.now();
      const numFlowers = 5;
      for (let i = 0; i < numFlowers; i++) {
        const flowerRadius = 80 + Math.sin(time / 400 + i * 2) * 24 + audioMod * 0.6;
        const numPetals = 7 + Math.floor(Math.abs(Math.sin(time / 900 + i)) * 5);
        const x = width / 2 + Math.cos(time / (1800 + i * 230)) * (width / 4) * Math.sin(i);
        const y = height / 2 + Math.sin(time / (1600 + i * 180)) * (height / 4) * Math.cos(i);
        drawFractalFlower(ctx, x, y, flowerRadius, numPetals, audioMod, time);
        // Draw flower center
        ctx.beginPath();
        ctx.arc(x, y, 18 + Math.sin(time / 300 + i) * 3 + audioMod * 0.04, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${(i * 70 + audioMod * 3) % 360}, 90%, 55%)`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => {
      running = false;
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ background: '#181818', display: 'block', margin: '0 auto', borderRadius: '10px' }}
    />
  );
};

export default FractalVisualizer;
