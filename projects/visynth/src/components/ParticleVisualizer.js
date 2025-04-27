// // components/ParticleVisualizer.js
// import React, { useRef, useEffect } from 'react';

// /**
//  * ParticleVisualizer
//  * Audio-reactive floating sand simulation, inspired by "sand" visualizers.
//  * Props:
//  *   - audioData: Uint8Array (frequency or time domain data from an analyser node)
//  *   - width: number (canvas width)
//  *   - height: number (canvas height)
//  */
// const NUM_PARTICLES = 3000;

// function lerp(a, b, t) {
//   return a + (b - a) * t;
// }

// function createParticle(width, height) {
//   // Restore center-clustered logic, but with a bigger swirl radius and larger grains
//   const theta = Math.random() * Math.PI * 2;
//   // Increase swirl radius multiplier for a bigger effect
//   const r = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48);
//   return {
//     x: width / 2 + Math.cos(theta) * r,
//     y: height / 2 + Math.sin(theta) * r,
//     vx: 0,
//     vy: 0,
//     angle: theta,
//     speed: 0.1 + Math.random() * 0.2,
//     baseSpeed: 0.1 + Math.random() * 0.2,
//     // Make grains visually larger
//     radius: 1.6 + Math.random() * 2.2,
//     colorSeed: Math.random(),
//   };
// }

// const ParticleVisualizer = ({ audioData, width = 600, height = 600 }) => {
//   const canvasRef = useRef(null);
//   const particlesRef = useRef([]);
//   const animationRef = useRef(null);

//   // Initialize particles
//   useEffect(() => {
//     particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => createParticle(width, height));
//   }, [width, height]);

//   // Animation loop
//   useEffect(() => {
//     let running = true;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const particles = particlesRef.current;
//     let lastTime = Date.now();

//     function getAudioMod() {
//       if (audioData && audioData.length > 0) {
//         // Use bass, mid, and amplitude
//         const bass = audioData.slice(0, Math.floor(audioData.length * 0.15));
//         const mid = audioData.slice(Math.floor(audioData.length * 0.2), Math.floor(audioData.length * 0.7));
//         const bassAvg = bass.reduce((a, b) => a + b, 0) / bass.length || 0;
//         const midAvg = mid.reduce((a, b) => a + b, 0) / mid.length || 0;
//         const amp = audioData.reduce((a, b) => a + b, 0) / audioData.length || 0;
//         return { bass: bassAvg / 255, mid: midAvg / 255, amp: amp / 255 };
//       }
//       return { bass: 0, mid: 0, amp: 0 };
//     }

//     function sandColor(p, t, amp, bass, mid) {
//       // Softly shifting sand color, modulated by audio
//       const h = lerp(35, 60, p.colorSeed) + amp * 80 + bass * 40 + Math.sin(t / 900 + p.colorSeed * 10) * 10;
//       const s = lerp(60, 95, p.colorSeed) - mid * 30;
//       const l = lerp(65, 90, p.colorSeed) + amp * 10;
//       return `hsl(${h % 360},${s}%,${l}%)`;
//     }

//     function render() {
//       if (!running) return;
//       // Fade out old trails for sand effect
//       ctx.globalAlpha = 0.18;
//       ctx.fillStyle = '#181818';
//       ctx.fillRect(0, 0, width, height);
//       ctx.globalAlpha = 1;

//       const { bass, mid, amp } = getAudioMod();
//       const t = Date.now();

//       // Center of sand swirl
//       const cx = width / 2;
//       const cy = height / 2;
//       // Audio modulates swirl, gravity, and turbulence
//       for (let i = 0; i < particles.length; i++) {
//         const p = particles[i];
//         // Swirl force (circular/spiral motion)
//         const swirl = 0.02 + amp * 0.11 + Math.sin(t / 1200 + p.colorSeed * 6) * 0.015;
//         const swirlAngle = Math.atan2(p.y - cy, p.x - cx) + Math.PI / 2;
//         // Gravity toward center
//         const dx = cx - p.x;
//         const dy = cy - p.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//         const gravity = lerp(0.003, 0.012, amp) * dist;
//         // Audio turbulence (makes the sand "boil")
//         const turbulence = Math.sin(t / (80 + i % 7 * 3) + p.colorSeed * 20 + amp * 8) * (0.15 + amp * 0.45);
//         // Update velocity
//         p.vx += Math.cos(swirlAngle) * swirl + dx / dist * gravity + Math.cos(t / 900 + p.colorSeed * 10) * turbulence * 0.03;
//         p.vy += Math.sin(swirlAngle) * swirl + dy / dist * gravity + Math.sin(t / 900 + p.colorSeed * 10) * turbulence * 0.03;
//         // Damping for smoothness
//         p.vx *= 0.92 - amp * 0.07;
//         p.vy *= 0.92 - amp * 0.07;
//         // Move
//         p.x += p.vx;
//         p.y += p.vy;
//         // If out of bounds, respawn near center (with bigger swirl radius)
//         if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
//           const theta = Math.random() * Math.PI * 2;
//           const r = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.48);
//           p.x = cx + Math.cos(theta) * r;
//           p.y = cy + Math.sin(theta) * r;
//           p.vx = 0;
//           p.vy = 0;
//         }
//         // Draw sand grain
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
//         ctx.fillStyle = sandColor(p, t, amp, bass, mid);
//         ctx.globalAlpha = 0.7 + amp * 0.25;
//         ctx.fill();
//         ctx.globalAlpha = 1;
//       }
//       animationRef.current = requestAnimationFrame(render);
//     }
//     // Fill background initially
//     ctx.fillStyle = '#181818';
//     ctx.fillRect(0, 0, width, height);
//     render();
//     return () => {
//       running = false;
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     };
//   }, [audioData, width, height]);

//   return (
//     <canvas
//       ref={canvasRef}
//       width={width}
//       height={height}
//       style={{ background: '#181818', display: 'block', margin: '0 auto', borderRadius: '10px' }}
//     />
//   );
// };

// export default ParticleVisualizer;
import React, { useRef, useEffect } from 'react';

const NUM_PARTICLES = 3000;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createParticle(width, height) {
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * (Math.min(width, height) * 0.45);
  return {
    x: width / 2 + Math.cos(theta) * r,
    y: height / 2 + Math.sin(theta) * r,
    baseAngle: theta,
    baseDistance: r,
    vx: 0,
    vy: 0,
    speed: 0.05 + Math.random() * 0.1,
    radius: 1.6 + Math.random() * 2.2,
    colorSeed: Math.random(),
  };
}

const ParticleVisualizer = ({ audioData, width = 600, height = 600 }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => createParticle(width, height));
  }, [width, height]);

  useEffect(() => {
    let bassEnvelope = 0;

    let running = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = particlesRef.current;

    function getAudioMod() {
      if (audioData && audioData.length > 0) {
        const bass = audioData.slice(0, Math.floor(audioData.length * 0.15));
        const amp = audioData.reduce((a, b) => a + b, 0) / audioData.length || 0;
        const bassAvg = bass.reduce((a, b) => a + b, 0) / bass.length || 0;
        return { bass: bassAvg / 255, amp: amp / 255 };
      }
      return { bass: 0, amp: 0 };
    }

    function sandColor(p, t, amp) {
      const h = lerp(15, 60, p.colorSeed) + amp * 40 + Math.sin(t / 1000 + p.colorSeed * 6) * 8;
      const s = 70;
      const l = 70 + amp * 10;
      return `hsl(${h % 360},${s}%,${l}%)`;
    }

    function render() {
      if (!running) return;

      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      const { bass, amp } = getAudioMod();
      // Smooth bass envelope for ripple
      bassEnvelope = lerp(bassEnvelope, bass, 0.1);
      const t = Date.now();
      const tSec = t / 1000;
      const cx = width / 2;
      const cy = height / 2;

      // Ripple and swirl parameters
      const waveFreq = 0.04;
      const waveSpeed = 0.25;
      const decay = 1.8;

      for (let p of particles) {
        // Ripple pulse modulates distance from center
        const wave = Math.sin(p.baseDistance * waveFreq - tSec * waveSpeed * 2 * Math.PI);
        const pulse = wave * bassEnvelope * 80 * Math.exp(-p.baseDistance * decay / 300);
        const dist = p.baseDistance + pulse;
        // Swirl motion
        const angle = p.baseAngle + tSec * p.speed;
        p.x = cx + Math.cos(angle) * dist;
        p.y = cy + Math.sin(angle) * dist;
        // Draw sand grain
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = sandColor(p, t, amp);
        ctx.globalAlpha = 0.6 + amp * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(render);
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    render();

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        background: '#0a0a0a',
        display: 'block',
        margin: '0 auto',
        borderRadius: '10px',
      }}
    />
  );
};

export default ParticleVisualizer;
