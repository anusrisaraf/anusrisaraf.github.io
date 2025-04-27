// components/AudioPlayer.js
import React, { useState, useEffect, useRef } from 'react';
// import './AudioPlayer.css';

const AudioPlayer = ({ mediaFile, onAudioData, onPlaybackTime }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize audio context and analyzer when file is loaded
  useEffect(() => {
    if (!mediaFile) return;
    
    // Reset state if changing files
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    // Create audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    // Set up analyzer node
    analyserRef.current.fftSize = 2048; // Can be adjusted for visualization detail
    analyserRef.current.smoothingTimeConstant = 0.8;
    analyserRef.current.connect(audioContextRef.current.destination);
    // Wait for audio element to be ready
    if (audioRef.current) {
      audioRef.current.load();
    }
    
    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (captureAudio.interval) {
        clearInterval(captureAudio.interval);
        captureAudio.interval = null;
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [mediaFile]);
  
  // Set up media element source when audio loads
  useEffect(() => {
    if (!audioContextRef.current || !audioRef.current || !analyserRef.current) return;
    
    const connectAudio = () => {
      // Only create a MediaElementSourceNode if one doesn't already exist for this audio element
      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      }
      // Always connect the analyser
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current.connect(analyserRef.current);
      // Start analysis loop
      captureAudio();
    };

    
    const handleCanPlay = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 0);
      }
      connectAudio();
    };
    
    audioRef.current.addEventListener('canplay', handleCanPlay);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [mediaFile]);
  
  // Capture audio data for visualization
  const captureAudio = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Make sure only one interval is running
    if (captureAudio.interval) clearInterval(captureAudio.interval);
    captureAudio.interval = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      onAudioData([...dataArray]); // always send a new array
      // Optionally, update playback time here as well
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        onPlaybackTime(audioRef.current.currentTime);
      }
    }, 33);

  };
  
  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Resume audio context if suspended (autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle seeking
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const seekTime = e.target.value;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle playback ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  return (
    <div className="audio-player">
      <audio 
        key={mediaFile?.url || ''}
        ref={audioRef}
        src={mediaFile?.url}
        preload="metadata"
        onEnded={handleEnded}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
      />
      
      {mediaFile && (
        <div className="file-info">
          <p className="file-name">{mediaFile.name}</p>
        </div>
      )}
      <div className="audio-player-scrubber">
        <span className="current-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="seek-slider"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          disabled={!mediaFile}
        />
        <span className="duration">{formatTime(duration)}</span>
      </div>
      
      <div className="audio-player-mainrow" style={{marginBottom: 16}}>
        <button className="play-pause-btn" onClick={togglePlay}>
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4.75C6 4.04777 6.71989 3.55091 7.33301 3.9111L18.714 10.1601C19.286 10.4929 19.286 11.3071 18.714 11.6399L7.33301 17.8889C6.71989 18.2491 6 17.7522 6 17.05V4.75Z" fill="currentColor"/>
            </svg>
          )}
        </button>
        <div className="volume-control">
          <div className="volume-control-btn">
          {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg> */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6.00001C9 6.00001 15 3.50001 15 12C15 20.5 9 18 9 18V6.00001Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M9 6.00001H6.5C5.94772 6.00001 5.5 6.44772 5.5 7.00001V17C5.5 17.5523 5.94772 18 6.5 18H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {volume > 0.5 && (
              <path d="M18 7C19.5 8.5 20 10.5 20 12C20 13.5 19.5 15.5 18 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {volume > 0.1 && (
              <path d="M17 9.5C17.8 10.3 18 11.2 18 12C18 12.8 17.8 13.7 17 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
          </div>
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;