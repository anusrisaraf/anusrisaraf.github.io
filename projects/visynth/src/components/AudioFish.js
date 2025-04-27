import React, { useRef, useEffect } from 'react';

export default function AudioFish({ audioData, fishCount = 5 }) {
  const canvasRef = useRef(null);
  const fishArrayRef = useRef([]);
  const animationRef = useRef();

  function genFish() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * 512,
      y: Math.random() * 290,
      angle,
      speed: 0,
      color: 'white',
      vx: 0,
      vy: 0,
    };
  }

  useEffect(() => {
    fishArrayRef.current = Array.from({ length: fishCount }, () => genFish());
  }, [fishCount]);

  const getVolume = (data) =>
    data ? data.reduce((sum, v) => sum + Math.abs(v - 128), 0) / data.length : 0;

  const getBandEnergy = (data, startRatio, endRatio) => {
    if (!data) return 0;
    const start = Math.floor(data.length * startRatio);
    const end = Math.floor(data.length * endRatio);
    const band = data.slice(start, end);
    return band.reduce((sum, v) => sum + Math.abs(v - 128), 0) / band.length;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let running = true;

    function animate() {
      if (!running) return;

      let volume = 0,
    bass = 0,
    treble = 0,
    isSilent = true;
if (audioData && audioData.length > 0) {
  volume = getVolume(audioData);
  bass = getBandEnergy(audioData, 0.0, 0.25);
  treble = getBandEnergy(audioData, 0.75, 1.0);
  // console.log('AudioFish volume:', volume);
}
isSilent = volume >126 || volume < 5;

      // Update fish
      // Inverted normalization: normVolume=0 at 128 (quiet), 1 at 60 (loud)
      const normVolume = (128 - Math.min(Math.max(volume, 60), 128)) / (128 - 60);
      const schoolingProb = normVolume * 0.3; // much less likely to school
      const schoolingRadius = 80;

      fishArrayRef.current = fishArrayRef.current.map((prev, idx, arr) => {
        if (isSilent) {
          // Freeze position and set gray
          return { ...prev, speed: 0, x: prev.x, y: prev.y };
        }
        // Move fish and set white
        // Stronger response to music
        // Use normVolume for speed and curviness
        let speed = 0.2 + 2.0 * normVolume + bass * 0.05;
        let curveAmount = 0.25 + (treble / 128) * 1.0 + normVolume * 0.4;
        let randomCurve = (Math.random() - 0.5) * curveAmount;
        // Burst forward if bass is high (random chance per frame)
        if (bass > 40 && Math.random() < 0.20) {
          speed *= 1.5;
        }
        let angle;
        if (Math.random() < schoolingProb) {
          // Find nearby fish
          let sumVx = 0, sumVy = 0, count = 0;
          arr.forEach((f, j) => {
            if (j !== idx) {
              const dx = f.x - prev.x;
              const dy = f.y - prev.y;
              if (dx * dx + dy * dy < schoolingRadius * schoolingRadius) {
                sumVx += typeof f.vx === 'number' ? f.vx : Math.cos(f.angle || 0);
                sumVy += typeof f.vy === 'number' ? f.vy : Math.sin(f.angle || 0);
                count++;
              }
            }
          });
          if (count > 0) {
            const mag = Math.sqrt(sumVx * sumVx + sumVy * sumVy) || 1;
            angle = Math.atan2(sumVy / mag, sumVx / mag) + randomCurve * 0.3;
          } else {
            angle = Math.atan2(prev.vy, prev.vx) + randomCurve;
          }
        } else {
          // Usual curvy movement
          angle = Math.atan2(prev.vy, prev.vx) + randomCurve;
        }
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        const dx = vx * speed;
        const dy = vy * speed;
        let newX = prev.x + dx;
        let newY = prev.y + dy;
        let newVx = vx;
        let newVy = vy;
        if (newX < 0 || newX > width) {
          newVx *= -1;
          newX = Math.max(0, Math.min(width, newX));
        }
        if (newY < 0 || newY > height) {
          newVy *= -1;
          newY = Math.max(0, Math.min(height, newY));
        }
        return {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          angle,
          speed,
          color: "#fff"
        };
      });

      // Draw
      ctx.clearRect(0, 0, width, height);
      // ctx.fillStyle = '#001f33'; // deep water background
      ctx.fillRect(0, 0, width, height);

      const time = Date.now() * 0.002;

      fishArrayRef.current.forEach((fish) => {
        ctx.save();
        ctx.translate(fish.x, fish.y);
        const drawAngle = Math.atan2(fish.vy, fish.vx);
        ctx.rotate(drawAngle);

        const wiggle = Math.sin(time + fish.x * 0.01) * 2; // very subtle body wiggle

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-20, -10 + wiggle, -30, 0);
        ctx.quadraticCurveTo(-20, 10 - wiggle, 0, 0);
        ctx.fillStyle = fish.color;
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioData, fishCount]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={290}
      style={{ height: '100%', width: '100%', marginTop: 12, borderRadius: 8 }}
    />
  );
}
