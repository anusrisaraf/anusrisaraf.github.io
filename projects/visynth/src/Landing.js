import React from 'react';
import './App.css';

export default function Landing({ onEnter }) {
  const [mouse, setMouse] = React.useState({ x: 0.5, y: 0.5 });
  const [win, setWin] = React.useState({ w: 1, h: 1 });

  React.useEffect(() => {
    function handleMove(e) {
      setMouse({
        x: (e.clientX || (e.touches && e.touches[0]?.clientX) || 0) / window.innerWidth,
        y: (e.clientY || (e.touches && e.touches[0]?.clientY) || 0) / window.innerHeight,
      });
    }
    function handleResize() {
      setWin({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const gradX = Math.round(mouse.x * win.w);
  const gradY = Math.round(mouse.y * win.h);
  // Use a huge radius so the gradient covers the whole screen
  const grad = `radial-gradient(circle 90vw at ${gradX}px ${gradY}px, rgba(47, 7, 55, 0.08) 0%, rgba(238, 5, 255, 0.08) 60%, rgb(17, 10, 40)  100%)`;
  const bg = `${grad}, rgb(17, 10, 40)`;

  return (
    <div className="landing-page" style={{background: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s', position: 'relative', overflow: 'hidden'}}>
      <img src="ribbon1.png" alt="ribbon background" style={{ position: 'absolute', top: -55, left: -38, width: '420px', opacity: 0.75, pointerEvents: 'none', zIndex: 0, userSelect: 'none' }} />
      {/* <h1 style={{ fontSize: '8rem', background: 'linear-gradient(to right, #fdf6e3, #ffe3b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>VISYNTH</h1> */}
      {/* <h1 style={{ fontFamily: 'PrettyWise', letterSpacing: '0.03em', fontSize: '8rem', background: 'linear-gradient(to right,rgb(244, 137, 75),rgb(246, 92, 133))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>visynth</h1> */}
      <h1 style={{ letterSpacing: '0.03em', fontSize: '8rem', background: 'linear-gradient(to right,rgb(244, 137, 75),rgb(246, 92, 133))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>VISYNTH</h1>
      <div style={{ letterSpacing: '0.03em',color: '#fff', background: 'linear-gradient(to right, #fdf6e3, #ffe3b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.3rem', marginBottom: '0.5rem', textAlign: 'center' }}>
        a collection of audio-reactive programmed visuals
      </div>
      <div style={{ 
          letterSpacing: '0.03em',color: '#bbb', background: 'linear-gradient(to right, #fdf6e3, #ffe3b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',fontSize: '1.1rem', marginBottom: '2.5rem', textAlign: 'center' }}>
        sri saraf
      </div>
      <button className="landbtn"
        onClick={onEnter}
        style={{
          fontFamily: 'PrettyWise',
          fontSize: '1.4rem',
          padding: '1rem',
          borderRadius: '7rem',
          aspectRatio: '1 / 1',
          border: 'none',
          background: 'linear-gradient(to right,rgb(244, 137, 75),rgb(246, 92, 133))',
          // background: 'linear-gradient(90deg,rgb(248, 129, 226) 0%,rgb(246, 92, 143) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          // color: '#fff',
          fontWeight: 600,
          letterSpacing: '0.1em',
          cursor: 'pointer',
          // transition: 'background 0.2s',
        }}
      >
        start
      </button>
      <img src="ribbon2.PNG" alt="ribbon background" style={{ position: 'absolute', bottom: -85, right: -18, transform: 'rotate(180deg)', width: '420px', opacity: 0.75, pointerEvents: 'none', zIndex: 0, userSelect: 'none' }} />
    </div>
  );
}
