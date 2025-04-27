import React, { useState } from 'react';
// import './App.css'

export default function InfoDot() {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'fixed', bottom: 18, left: 18, zIndex: 100 }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #818cf8 0%, #8b5cf6 100%)',
          boxShadow: '0 2px 8px #0008',
          cursor: 'pointer',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Show info"
      >
        {/* <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> */}
      </div>
      {hover && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          minWidth: 220,
          background: 'rgba(20,20,30,0.98)',
          color: '#fff',
          borderRadius: 12,
          // boxShadow: '0 4px 24px #000c',
          padding: '1.2rem 1.5rem',
          fontSize: '1.08rem',
          lineHeight: 1.6,
          textAlign: 'left',
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}>
          <div style={{fontFamily: 'PrettyWise',fontWeight: 700, fontSize: '1.15rem', marginBottom: 6, background: 'linear-gradient(to right, #fdf6e3, #ffe3b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VISYNTH</div>
          {/* <div style={{ color: '#bbb', marginBottom: 4 }}>a growing collection of audio-reactive visuals</div> */}
          <div style={{ color: '#bbb', fontSize: '0.98rem' }}>sri saraf</div>
        </div>
      )}
    </div>
  );
}
