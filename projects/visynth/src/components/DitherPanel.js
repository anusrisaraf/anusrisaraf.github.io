// DitherPanel.js
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import AudioPlayer from './AudioPlayer';
import ImageUpload from './ImageUpload';
export default function DitherPanel({ onFileLoaded, mediaFile, audioData, AudioPlayerComponent, handleAudioData, onImageChange, imageUrl, algorithm, setAlgorithm, color0, color1, setColor0, setColor1, ditherMode, setDitherMode, numColors, setNumColors }) {

  // imageUrl and onImageChange are now controlled by MainApp

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {mediaFile && (
        <div>
          <AudioPlayerComponent
            mediaFile={mediaFile}
            onAudioData={handleAudioData}
            onPlaybackTime={() => {}}
          />
        </div>
      )}
      <FileUpload onFileLoaded={onFileLoaded} variant="dither" file={mediaFile} />
      
      <div>
        <ImageUpload onImageLoaded={onImageChange} imageUrl={imageUrl} variant="dither" />
      </div>
      <label style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'block' }}>
        dithering algorithm:
        <select
          className="dither-dropdown"
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="threshold">threshold</option>
          <option value="floyd-steinberg">floyd-steinberg</option>
          <option value="atkinson">atkinson</option>
          <option value="bayer">bayer</option>
          {/* <option value="jarvis">Jarvis-Judice-Ninke</option> */}
        </select>
      </label>
      <button
        className="balloon-disc-btn"
        style={{ marginBottom: 16, marginTop: 0 }}
        onClick={() => setDitherMode(m => m === 'bw' ? 'color' : 'bw')}
      >
        {ditherMode === 'bw' ? 'switch to color dithering' : 'switch to b/w dithering'}
      </button>
      {ditherMode === 'color' && (
        // <div className="plants-controls" style={{ padding: 0,marginTop: 8, width: '100%', overflowX: 'hidden' }}>
        // <label className="fish-slider-label" style={{ color: 'white', marginTop: 0, display: 'block', marginBottom: 0 }}>
        //   number of fish:
        //   <span style={{ marginLeft: 10, color: '#ffe', fontWeight: 700, fontSize: '1.08em' }}>{fishCount}</span>
        // </label>
        // <div style={{ width: '100%' }}>
        //   <input
        //     type="range"
        //     min={1}
        //     max={20}
        //     value={fishCount}
        //     onChange={(e) => onFishCountChange(Number(e.target.value))}
        //     className="sandball-slider"
        //     style={{ width: '100%' }}
        //   />
        // </div>
      // </div>
      <div className="plants-controls" style={{ padding: 0,marginTop: 8, width: '100%', overflowX: 'hidden' }}>
        <label className="fish-slider-label" style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'block' }}>
          number of colors:
          <span style={{ marginLeft: 10, fontWeight: 400 }}>{numColors}</span>
          <div style={{ width: '100%' }}>
          <input
            type="range"
            min={2}
            max={16}
            step={1}
            value={numColors}
            onChange={e => setNumColors(Number(e.target.value))}
            className="sandball-slider"
            style={{ marginLeft: 10,paddingRight: 10, width: '100%' }}
          />
          
          </div>
        </label>
      </div>
      )}
      {ditherMode === 'bw' && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
            black:
            <input
              type="color"
              className="color-circle-input"
              value={color0}
              onChange={e => setColor0(e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
            white:
            <input
              type="color"
              className="color-circle-input"
              value={color1}
              onChange={e => setColor1(e.target.value)}
            />
          </label>
          
        </div>
      )}
      <div style={{ color: 'white', marginTop: '18px', display: 'block' }}>
            Once you've uploaded an audio/video and image file, explore the dithering algorithms. Switching from b/w mode to color mode will perform k-means on the image, but will only be audio reactive with the threshold algorithm, but the floyd algorithm's diffusion will still be visible.
          </div>
      <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #333' }} />
      {/* AudioDitherPanel will be rendered by parent (App.js) */}
    </div>
  );
}
