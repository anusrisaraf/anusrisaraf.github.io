import React from 'react';
import FileUpload from './FileUpload';
import AudioPlayer from './AudioPlayer';

export default function FishPanel({
  onFileLoaded,
  mediaFile,
  audioData,
  AudioPlayerComponent,
  handleAudioData,
  onImageChange,
  imageUrl,
  fishCount,
  onFishCountChange,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 0 }}>
      {mediaFile && (
          <AudioPlayer
            mediaFile={mediaFile}
            onAudioData={handleAudioData}
            onPlaybackTime={() => {}}
          />
        )}
        <FileUpload onFileLoaded={onFileLoaded} variant="plants" file={mediaFile} />
        
      </div>

      <div className="plants-controls" style={{ padding: 0, marginTop: 16, width: '100%', overflowX: 'hidden', paddingBottom: 18, paddingRight: 8 }}>
        <label className="fish-slider-label" style={{ color: 'white', marginTop: 0, display: 'block', marginBottom: 8 }}>
          number of fish:
          <span style={{ marginLeft: 10, color: '#ffe', fontWeight: 700, fontSize: '1.08em' }}>{fishCount}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={fishCount}
          onChange={(e) => onFishCountChange(Number(e.target.value))}
          className="sandball-slider"
          style={{ width: '100%', marginTop: 6, marginBottom: 6 }}
        />
      </div>
      <div style={{ color: 'white', marginTop: '18px', display: 'block' }}>
            Once you've uploaded a audio/video file, watch the flutterfish dance to the music, turning, speeding up, and schooling based on the waveform.
          </div>
    </div>
  );
}
