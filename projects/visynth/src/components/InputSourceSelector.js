import React from 'react';

export default function InputSourceSelector({ inputSource, setInputSource }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ color: 'white', fontWeight: 600, marginBottom: 8, display: 'block' }}>
        Audio Input Source:
        <select
          value={inputSource}
          onChange={e => setInputSource(e.target.value)}
          style={{
            marginLeft: 10,
            padding: '5px 14px',
            borderRadius: 6,
            border: '1px solid #888',
            fontSize: '1rem',
            background: '#181818',
            color: '#fff',
            fontFamily: 'Manrope, Arial, sans-serif',
            fontWeight: 500
          }}
        >
          <option value="file">File Upload</option>
          <option value="mic">Microphone</option>
        </select>
      </label>
    </div>
  );
}
