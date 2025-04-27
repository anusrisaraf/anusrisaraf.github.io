// IntegratedVisualizer.js
import React, { useState, useEffect, useRef } from 'react';
import Sketch from 'react-p5';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const IntegratedVisualizer = ({ token, currentTrack, mode }) => {
  // State for audio data
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [visualizationData, setVisualizationData] = useState(null);
  
  // Refs for animation and canvas
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const canvasParentRef = useRef(null);
  
  // Set up Spotify API with token
  useEffect(() => {
    if (token) {
      spotifyApi.setAccessToken(token);
    }
  }, [token]);
  
  // Fetch audio analysis and features when track changes
  useEffect(() => {
    if (!currentTrack || !token) return;
    
    const fetchAudioData = async () => {
      try {
        // Get audio features (tempo, key, energy, etc.)
        const features = await spotifyApi.getAudioFeatures(currentTrack.id);
        setAudioFeatures(features);
        
        // Get detailed audio analysis (segments, beats, etc.)
        const analysis = await spotifyApi.getAudioAnalysis(currentTrack.id);
        setAudioAnalysis(analysis);
        
        // Reset playback position
        setPlaybackPosition(0);
        startTimeRef.current = Date.now() / 1000;
      } catch (error) {
        console.error('Error fetching audio data:', error);
      }
    };
    
    fetchAudioData();
    
    // Start the animation timer
    startAnimationTimer();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentTrack, token]);
  
  // Timer to simulate playback position
  const startAnimationTimer = () => {
    startTimeRef.current = Date.now() / 1000;
    
    const updateTimer = () => {
      const currentTime = Date.now() / 1000;
      const elapsed = currentTime - startTimeRef.current;
      
      setPlaybackPosition(elapsed);
      
      // Update visualization data based on current position
      if (audioAnalysis) {
        const data = createVisualizationFromAnalysis(audioAnalysis, elapsed);
        setVisualizationData(data);
      }
      
      animationRef.current = requestAnimationFrame(updateTimer);
    };
    
    updateTimer();
  };
  
  // Create visualization data from analysis
  const createVisualizationFromAnalysis = (analysis, position) => {
    // Find current segment, beat, and section
    const currentSegment = analysis.segments.find((segment, index) => {
      const nextSegment = analysis.segments[index + 1];
      return position >= segment.start && 
             (!nextSegment || position < nextSegment.start);
    });
    
    const currentBeat = analysis.beats.find((beat, index) => {
      const nextBeat = analysis.beats[index + 1];
      return position >= beat.start && 
             (!nextBeat || position < nextBeat.start);
    });
    
    const currentBar = analysis.bars.find((bar, index) => {
      const nextBar = analysis.bars[index + 1];
      return position >= bar.start && 
             (!nextBar || position < nextBar.start);
    });
    
    const currentSection = analysis.sections.find((section, index) => {
      const nextSection = analysis.sections[index + 1];
      return position >= section.start && 
             (!nextSection || position < nextSection.start);
    });
    
    // Calculate beat progress for animations
    let beatProgress = 0;
    if (currentBeat) {
      beatProgress = (position - currentBeat.start) / currentBeat.duration;
    }
    
    // Return structured data for visualization
    return {
      pitches: currentSegment ? currentSegment.pitches : Array(12).fill(0.5),
      timbre: currentSegment ? currentSegment.timbre : Array(12).fill(0),
      loudness: currentSegment ? 
        mapLoudness(currentSegment.loudness_max) : 0.5,
      beatConfidence: currentBeat ? currentBeat.confidence : 0,
      beatProgress: beatProgress,
      barProgress: currentBar ? 
        (position - currentBar.start) / currentBar.duration : 0,
      sectionEnergy: currentSection ? currentSection.loudness / -60 : 0.5,
      tempo: analysis.track.tempo,
      key: analysis.track.key,
      mode: analysis.track.mode
    };
  };
  
  // Map loudness values (typically -60 to 0 dB) to a 0-1 range
  const mapLoudness = (loudness) => {
    return Math.min(1, Math.max(0, (loudness + 60) / 60));
  };
  
  // p5.js setup function
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6).parent(canvasParentRef);
    p5.colorMode(p5.HSB, 1);
    canvasParentRef.current = canvasParentRef;
  };
  
  // p5.js draw function
  const draw = (p5) => {
    p5.background(0, 0, 0.1, 0.1); // Semi-transparent background for trails
    
    if (!visualizationData || !currentTrack) {
      drawPlaceholder(p5);
      return;
    }
    
    // Draw based on selected visualization mode
    switch (mode) {
      case 'frequency':
        drawPitchVisualization(p5, visualizationData);
        break;
      case 'waveform':
        drawTimbreVisualization(p5, visualizationData);
        break;
      case 'particles':
        drawParticleVisualization(p5, visualizationData);
        break;
      default:
        drawPitchVisualization(p5, visualizationData);
    }
    
    // Display track info
    drawTrackInfo(p5, currentTrack, audioFeatures, playbackPosition);
  };
  
  // Placeholder visualization
  const drawPlaceholder = (p5) => {
    p5.fill(1, 0, 1, 1);
    p5.textSize(24);
    p5.textAlign(p5.CENTER, p5.CENTER);
    
    if (!currentTrack) {
      p5.text('Select a track to start visualization', p5.width / 2, p5.height / 2);
    } else {
      p5.text('Loading audio data...', p5.width / 2, p5.height / 2);
    }
    
    // Animated circles
    p5.noFill();
    p5.stroke(0.3, 0.8, 1, 0.6);
    
    for (let i = 0; i < 5; i++) {
      let size = 100 + i * 50;
      let pulse = p5.sin(p5.frameCount / 30 + i * 0.5) * 20;
      p5.strokeWeight(1 + p5.sin(p5.frameCount / 30 + i) * 1);
      p5.circle(p5.width / 2, p5.height / 2, size + pulse);
    }
  };
  
  // Visualization using pitch data
  const drawPitchVisualization = (p5, data) => {
    const { pitches, beatProgress, loudness } = data;
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const radius = Math.min(p5.width, p5.height) * 0.35;
    
    // Beat pulse effect
    const beatSize = radius * (1 + 0.2 * Math.sin(beatProgress * Math.PI * 2));
    
    // Draw pitch circle
    p5.noFill();
    p5.strokeWeight(3);
    
    // Main circle
    p5.stroke(0.6, 0.5, 1, 0.3);
    p5.circle(centerX, centerY, beatSize * 2);
    
    // Draw each pitch as a line from center
    for (let i = 0; i < pitches.length; i++) {
      const angle = p5.map(i, 0, pitches.length, 0, p5.TWO_PI);
      const pitchValue = pitches[i];
      
      // Calculate end points based on pitch value
      const x = centerX + Math.cos(angle) * radius * pitchValue * 2;
      const y = centerY + Math.sin(angle) * radius * pitchValue * 2;
      
      // Color based on pitch position (hue maps to musical notes)
      const hue = p5.map(i, 0, pitches.length, 0, 1);
      p5.stroke(hue, 0.7, 1, 0.8);
      p5.strokeWeight(3 + pitchValue * 5);
      
      // Line from center to pitch point
      p5.line(centerX, centerY, x, y);
      
      // Draw circle at the end
      p5.fill(hue, 0.7, 1, 0.6);
      p5.circle(x, y, 10 + pitchValue * 20);
    }
    
    // Draw circular waveform connecting pitch points
    p5.noFill();
    p5.strokeWeight(2);
    p5.stroke(0.5, 0.5, 1, 0.5);
    p5.beginShape();
    
    for (let i = 0; i < pitches.length; i++) {
      const angle = p5.map(i, 0, pitches.length, 0, p5.TWO_PI);
      const pitchValue = pitches[i];
      const x = centerX + Math.cos(angle) * radius * pitchValue * 2;
      const y = centerY + Math.sin(angle) * radius * pitchValue * 2;
      
      p5.curveVertex(x, y);
      
      // Add first and last point again for a closed curve
      if (i === 0 || i === pitches.length - 1) {
        p5.curveVertex(x, y);
      }
    }
    
    p5.endShape(p5.CLOSE);
    
    // Loudness indicator
    p5.noStroke();
    p5.fill(0.8, 0.7, 1, loudness * 0.3);
    p5.circle(centerX, centerY, radius * loudness * 3);
  };
  
  // Visualization using timbre data
  const drawTimbreVisualization = (p5, data) => {
    const { timbre, beatProgress, barProgress } = data;
    const timbreNormalized = timbre.map(t => p5.map(t, -100, 100, 0, 1));
    
    // Calculate parameters for the visualization
    const barWidth = p5.width / timbreNormalized.length;
    const maxHeight = p5.height * 0.8;
    
    // Beat and bar effects
    const pulse = 1 + 0.2 * Math.sin(beatProgress * Math.PI * 2);
    const barPhase = barProgress * Math.PI * 2;
    
    // Background effect
    p5.fill(0.7, 0.3, 0.9, 0.05);
    p5.rect(0, 0, p5.width, p5.height);
    
    // Draw each timbre component
    for (let i = 0; i < timbreNormalized.length; i++) {
      const value = timbreNormalized[i];
      
      // Position
      const x = i * barWidth;
      const height = maxHeight * value * pulse;
      const y = p5.height / 2 - height / 2;
      
      // Color based on timbre component
      const hue = p5.map(i, 0, timbreNormalized.length, 0, 1);
      p5.fill(hue, 0.7, 1, 0.7);
      
      // Draw bar
      p5.rect(x, y, barWidth - 2, height);
      
      // Mirror effect - draw circles at the top and bottom
      p5.fill(hue, 0.8, 1, 0.6);
      p5.circle(x + barWidth / 2, y, 20 * value);
      p5.circle(x + barWidth / 2, y + height, 20 * value);
      
      // Connect with lines that move with the bar progress
      p5.stroke(hue, 0.5, 1, 0.3);
      p5.strokeWeight(2);
      const waveY = p5.sin(i * 0.5 + barPhase) * 50 * value;
      p5.line(
        x + barWidth / 2, 
        y, 
        x + barWidth / 2, 
        p5.height / 2 + waveY
      );
      p5.line(
        x + barWidth / 2, 
        y + height, 
        x + barWidth / 2, 
        p5.height / 2 - waveY
      );
    }
  };
  
  // Particle-based visualization
  const drawParticleVisualization = (p5, data) => {
    const { pitches, timbre, beatProgress, loudness, tempo } = data;
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    
    // Number of particles based on tempo
    const numParticles = Math.floor(p5.map(tempo, 60, 180, 50, 150));
    
    // Beat-driven effects
    const beatPulse = p5.sin(beatProgress * Math.PI * 2);
    const beatSize = 1 + 0.3 * (beatPulse > 0 ? beatPulse : 0);
    
    // Background fading
    p5.fill(0, 0, 0.1, 0.1);
    p5.rect(0, 0, p5.width, p5.height);
    
    // Create circular emitter of particles
    for (let i = 0; i < numParticles; i++) {
      // Map particle index to pitch and timbre arrays
      const pitchIndex = i % pitches.length;
      const timbreIndex = i % timbre.length;
      
      // Normalize timbre value
      const timbreValue = p5.map(timbre[timbreIndex], -100, 100, 0, 1);
      
      // Calculate angle based on position in array
      const angle = p5.map(i, 0, numParticles, 0, p5.TWO_PI);
      
      // Dynamic radius based on pitch and beat
      const radius = 100 + pitches[pitchIndex] * 200 * beatSize;
      
      // Position with some randomness
      const noise = p5.noise(i * 0.1, p5.frameCount * 0.01) * 50;
      const x = centerX + Math.cos(angle + p5.frameCount * 0.02) * (radius + noise);
      const y = centerY + Math.sin(angle + p5.frameCount * 0.02) * (radius + noise);
      
      // Size based on loudness and timbre
      const size = 3 + loudness * 20 * timbreValue;
      
      // Color based on pitch position
      const hue = p5.map(pitchIndex, 0, pitches.length, 0, 1);
      p5.noStroke();
      p5.fill(hue, 0.7, 1, 0.7);
      
      // Draw particle
      p5.circle(x, y, size);
      
      // Connect some particles back to center with lines
      if (i % 8 === 0) {
        p5.stroke(hue, 0.5, 1, 0.2);
        p5.strokeWeight(1);
        p5.line(centerX, centerY, x, y);
      }
      
      // Connect to adjacent particles with curves for some of them
      if (i % 4 === 0 && i < numParticles - 1) {
        const nextPitchIndex = (i + 1) % pitches.length;
        const nextAngle = p5.map(i + 1, 0, numParticles, 0, p5.TWO_PI);
        const nextRadius = 100 + pitches[nextPitchIndex] * 200 * beatSize;
        const nextNoise = p5.noise((i + 1) * 0.1, p5.frameCount * 0.01) * 50;
        
        const nextX = centerX + Math.cos(nextAngle + p5.frameCount * 0.02) * (nextRadius + nextNoise);
        const nextY = centerY + Math.sin(nextAngle + p5.frameCount * 0.02) * (nextRadius + nextNoise);
        
        p5.noFill();
        p5.stroke(hue, 0.6, 1, 0.3);
        p5.bezier(
          x, y,
          x + (nextX - x) * 0.4, y + (nextY - y) * 0.1,
          x + (nextX - x) * 0.6, y + (nextY - y) * 0.9,
          nextX, nextY
        );
      }
    }
    
    // Central pulse based on beats
    p5.noFill();
    p5.stroke(0.6, 0.5, 1, 0.3 * (beatPulse + 1) / 2);
    p5.strokeWeight(3 * beatSize);
    p5.circle(centerX, centerY, 80 * beatSize);
  };
  
  // Display track information and playback progress
  const drawTrackInfo = (p5, track, features, position) => {
    p5.fill(1, 0, 1, 1);
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.TOP);
    
    // Title and artist
    p5.textSize(24);
    p5.text(track.name, 20, 20);
    p5.textSize(16);
    p5.text(track.artists[0].name, 20, 50);
    
    // Audio features if available
    if (features) {
      p5.textSize(14);
      p5.text(`Tempo: ${Math.round(features.tempo)} BPM`, 20, 80);
      p5.text(`Key: ${getKeyName(features.key, features.mode)}`, 20, 100);
      p5.text(`Energy: ${Math.round(features.energy * 100)}%`, 20, 120);
    }
    
    // Playback position
    if (audioAnalysis) {
      const duration = audioAnalysis.track.duration;
      const progress = Math.min(1, position / duration);
      
      // Progress bar
      p5.noStroke();
      p5.fill(0.3, 0.3, 0.5, 0.5);
      p5.rect(20, p5.height - 30, p5.width - 40, 10);
      p5.fill(0.5, 0.8, 1, 1);
      p5.rect(20, p5.height - 30, (p5.width - 40) * progress, 10);
      
      // Time display
      p5.fill(1, 0, 1, 1);
      p5.textSize(12);
      p5.textAlign(p5.LEFT, p5.TOP);
      p5.text(formatTime(position), 20, p5.height - 50);
      p5.textAlign(p5.RIGHT, p5.TOP);
      p5.text(formatTime(duration), p5.width - 20, p5.height - 50);
    }
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Convert key and mode to human-readable format
  const getKeyName = (key, mode) => {
    const keys = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
    const modes = ['minor', 'major'];
    return `${keys[key]} ${modes[mode]}`;
  };
  
  // p5.js windowResized handler
  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6);
  };
  
  return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};

export default IntegratedVisualizer;