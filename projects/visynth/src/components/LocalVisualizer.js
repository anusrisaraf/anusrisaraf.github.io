// components/LocalVisualizer.js
import React, { useRef, useState, useEffect } from 'react';
import Sketch from 'react-p5';

const LocalVisualizer = ({ audioData, playbackTime, mediaFile, visualMode }) => {
  const canvasParentRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [audioFeatures, setAudioFeatures] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    amplitude: 0
  });
  
  // Extract audio features from frequency data
  useEffect(() => {
    if (!audioData) return;
    
    // Calculate average values for different frequency ranges
    const extractFeatures = () => {
      // Low frequencies (bass): 20-250Hz
      const bassRange = { start: 0, end: Math.floor(audioData.length * 0.1) };
      // Mid frequencies: 250-2000Hz
      const midRange = { 
        start: bassRange.end, 
        end: Math.floor(audioData.length * 0.4) 
      };
      // High frequencies (treble): 2000-20000Hz
      const trebleRange = { start: midRange.end, end: audioData.length - 1 };
      
      // Calculate averages for each range
      let bassSum = 0;
      for (let i = bassRange.start; i < bassRange.end; i++) {
        bassSum += audioData[i];
      }
      const bassAvg = bassSum / (bassRange.end - bassRange.start);
      
      let midSum = 0;
      for (let i = midRange.start; i < midRange.end; i++) {
        midSum += audioData[i];
      }
      const midAvg = midSum / (midRange.end - midRange.start);
      
      let trebleSum = 0;
      for (let i = trebleRange.start; i < trebleRange.end; i++) {
        trebleSum += audioData[i];
      }
      const trebleAvg = trebleSum / (trebleRange.end - trebleRange.start);
      
      // Calculate overall amplitude
      let totalSum = 0;
      for (let i = 0; i < audioData.length; i++) {
        totalSum += audioData[i];
      }
      const amplitude = totalSum / audioData.length;
      
      // Normalize values (0-1)
      setAudioFeatures({
        bass: bassAvg / 255,
        mid: midAvg / 255,
        treble: trebleAvg / 255,
        amplitude: amplitude / 255
      });
    };
    
    extractFeatures();
  }, [audioData]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasParentRef.current) {
        setDimensions({
          width: canvasParentRef.current.offsetWidth,
          height: canvasParentRef.current.offsetHeight
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // p5.js setup function
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6).parent(canvasParentRef);
    canvasParentRef.current = canvasParentRef;
    p5.colorMode(p5.HSB, 1);
  };
  
  // p5.js draw function
  const draw = (p5) => {
    p5.background(0, 0, 0.1, 0.1); // Semi-transparent background for trails
    
    if (!audioData || !mediaFile) {
      drawPlaceholder(p5);
      return;
    }
    
    // Draw based on selected visualization mode
    switch (visualMode) {
      case 'frequency':
        drawFrequencyVisualization(p5, audioData, audioFeatures);
        break;
      case 'waveform':
        drawWaveformVisualization(p5, audioData, audioFeatures);
        break;
      case 'particles':
        drawParticleVisualization(p5, audioData, audioFeatures);
        break;
      default:
        drawFrequencyVisualization(p5, audioData, audioFeatures);
    }
    
    // Display file information
    drawFileInfo(p5, mediaFile, playbackTime);
  };
  
  // Placeholder visualization when no file is playing
  const drawPlaceholder = (p5) => {
    p5.fill(1, 0, 1, 1);
    p5.textSize(24);
    p5.textAlign(p5.CENTER, p5.CENTER);
    
    if (!mediaFile) {
      p5.text('Upload an audio file to start visualization', p5.width / 2, p5.height / 2);
    } else {
      p5.text('Press play to start visualization', p5.width / 2, p5.height / 2);
    }
    
    // Animated circles
    p5.noFill();
    p5.stroke(0.6, 0.5, 1, 0.5);
    
    for (let i = 0; i < 5; i++) {
      let size = 100 + i * 50;
      let pulse = p5.sin(p5.frameCount / 30 + i * 0.5) * 20;
      p5.strokeWeight(1 + p5.sin(p5.frameCount / 30 + i) * 1);
      p5.circle(p5.width / 2, p5.height / 2, size + pulse);
    }
  };
  
  // Frequency-based visualization (spectrum analyzer)
  const drawFrequencyVisualization = (p5, audioData, features) => {
    const { bass, mid, treble, amplitude } = features;
    const barWidth = p5.width / audioData.length;
    
    // Draw frequency bars
    for (let i = 0; i < audioData.length; i++) {
      // Map frequency index to hue
      const hue = p5.map(i, 0, audioData.length, 0, 1);
      
      // Determine frequency range for color variation
      let saturation = 0.8;
      let brightness = 1;
      
      // Low frequencies (red to yellow)
      if (i < audioData.length * 0.1) {
        saturation = 0.8 + bass * 0.2;
        brightness = 0.8 + bass * 0.2;
      } 
      // Mid frequencies (green)
      else if (i < audioData.length * 0.4) {
        saturation = 0.7 + mid * 0.3;
        brightness = 0.7 + mid * 0.3;
      } 
      // High frequencies (blue to violet)
      else {
        saturation = 0.6 + treble * 0.4;
        brightness = 0.6 + treble * 0.4;
      }
      
      // Draw bar
      const barHeight = audioData[i] * 1.5;
      p5.noStroke();
      p5.fill(hue, saturation, brightness, 0.8);
      p5.rect(i * barWidth, p5.height, barWidth, -barHeight);
      
      // Add glow effect
      if (audioData[i] > 200) {
        p5.fill(hue, saturation, brightness, 0.3);
        p5.rect(i * barWidth - barWidth/2, p5.height, barWidth * 2, -barHeight * 1.2);
      }
    }
    
    // Draw circular amplitude indicator
    const centerX = p5.width / 2;
    const centerY = p5.height / 3;
    const maxRadius = p5.min(p5.width, p5.height) * 0.2;
    
    p5.noFill();
    p5.strokeWeight(3);
    p5.stroke(p5.map(amplitude, 0, 1, 0, 0.8), 0.7, 1, 0.7);
    p5.circle(centerX, centerY, maxRadius * (1 + amplitude * 2));
    
    // Add bass-driven pulse
    p5.strokeWeight(2);
    p5.stroke(0.05, 0.8, 1, bass * 0.8);
    p5.circle(centerX, centerY, maxRadius * (1 + bass * 3));
  };
  
  // Waveform visualization
  const drawWaveformVisualization = (p5, audioData, features) => {
    const { bass, mid, treble, amplitude } = features;
    const centerY = p5.height / 2;
    
    // Create mirrored waveform
    p5.strokeWeight(2);
    p5.noFill();
    
    // Draw upper waveform
    p5.beginShape();
    p5.stroke(0.6, 0.8, 1, 0.8);
    
    for (let i = 0; i < audioData.length; i += 4) {
      const x = p5.map(i, 0, audioData.length, 0, p5.width);
      const y = p5.map(audioData[i], 0, 255, centerY, centerY - p5.height / 3);
      p5.vertex(x, y);
    }
    
    p5.endShape();
    
    // Draw lower waveform (mirrored)
    p5.beginShape();
    p5.stroke(0.1, 0.8, 1, 0.8);
    
    for (let i = 0; i < audioData.length; i += 4) {
      const x = p5.map(i, 0, audioData.length, 0, p5.width);
      const y = p5.map(audioData[i], 0, 255, centerY, centerY + p5.height / 3);
      p5.vertex(x, y);
    }
    
    p5.endShape();
    
    // Add frequency-based circles
    // Bass circle
    p5.noFill();
    p5.strokeWeight(3 + bass * 5);
    p5.stroke(0.05, 0.9, 1, bass * 0.7);
    p5.circle(p5.width * 0.25, centerY, 50 + bass * 100);
    
    // Mid circle
    p5.strokeWeight(2 + mid * 4);
    p5.stroke(0.3, 0.8, 1, mid * 0.7);
    p5.circle(p5.width * 0.5, centerY, 40 + mid * 80);
    
    // Treble circle
    p5.strokeWeight(1 + treble * 3);
    p5.stroke(0.6, 0.7, 1, treble * 0.7);
    p5.circle(p5.width * 0.75, centerY, 30 + treble * 60);
    
    // Connect circles with lines
    p5.strokeWeight(1);
    p5.stroke(0.2, 0.5, 1, 0.3);
    p5.line(p5.width * 0.25, centerY, p5.width * 0.5, centerY);
    p5.line(p5.width * 0.5, centerY, p5.width * 0.75, centerY);
  };
  
  // Particle-based visualization
  const drawParticleVisualization = (p5, audioData, features) => {
    const { bass, mid, treble, amplitude } = features;
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    
    // Number of particles based on amplitude
    const numParticles = Math.floor(50 + amplitude * 150);
    
    // Background with subtle fade
    p5.fill(0, 0, 0.1, 0.1);
    p5.rect(0, 0, p5.width, p5.height);
    
    // Draw particles
    for (let i = 0; i < numParticles; i++) {
      // Calculate frequency bin for this particle
      const freqIndex = Math.floor(p5.map(i, 0, numParticles, 0, audioData.length - 1));
      const audioValue = audioData[freqIndex] / 255;
      
      // Angle and radius based on particle index
      const angle = p5.map(i, 0, numParticles, 0, p5.TWO_PI * 3);
      
      // Determine radius based on frequency range
      let radius;
      let hue;
      
      if (freqIndex < audioData.length * 0.1) {
        // Bass frequencies - inner circle
        radius = (0.1 + bass * 0.3) * p5.min(p5.width, p5.height) / 2;
        hue = p5.map(bass, 0, 1, 0, 0.1);
      } else if (freqIndex < audioData.length * 0.4) {
        // Mid frequencies - middle circle
        radius = (0.3 + mid * 0.3) * p5.min(p5.width, p5.height) / 2;
        hue = p5.map(mid, 0, 1, 0.3, 0.5);
      } else {
        // High frequencies - outer circle
        radius = (0.5 + treble * 0.3) * p5.min(p5.width, p5.height) / 2;
        hue = p5.map(treble, 0, 1, 0.6, 0.9);
      }
      
      // Add some noise to position for organic feel
      const noise = p5.noise(i * 0.1, p5.frameCount * 0.01) * 30 * audioValue;
      const x = centerX + Math.cos(angle + p5.frameCount * 0.01) * (radius + noise);
      const y = centerY + Math.sin(angle + p5.frameCount * 0.01) * (radius + noise);
      
      // Particle size based on audio value
      const size = 2 + audioValue * 10;
      
      // Draw particle
      p5.noStroke();
      p5.fill(hue, 0.8, 1, 0.7);
      p5.circle(x, y, size);
      
      // Connect some particles to center with lines
      if (i % 8 === 0 && audioValue > 0.5) {
        p5.stroke(hue, 0.5, 1, 0.2);
        p5.strokeWeight(1 + audioValue);
        p5.line(centerX, centerY, x, y);
      }
    }
    
    // Central pulse based on bass
    p5.noFill();
    p5.strokeWeight(2 + bass * 4);
    p5.stroke(0.1, 0.9, 1, bass * 0.6);
    p5.circle(centerX, centerY, 20 + bass * 100);
    
    // Second pulse based on overall amplitude
    p5.strokeWeight(1 + amplitude * 3);
    p5.stroke(0.7, 0.8, 1, amplitude * 0.5);
    p5.circle(centerX, centerY, 40 + amplitude * 150);
  };
  
  // Display file information and playback time
  const drawFileInfo = (p5, file, currentTime) => {
    if (!file) return;
    
    p5.fill(1, 0, 1, 1);
    p5.noStroke();
    p5.textAlign(p5.LEFT, p5.TOP);
    
    // File name
    p5.textSize(16);
    p5.text(file.name, 20, 20);
    
    // Playback time
    if (currentTime !== undefined) {
      p5.textSize(14);
      p5.text(formatTime(currentTime), 20, 50);
    }
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // p5.js windowResized function
  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6);
  };
  
  return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};

export default LocalVisualizer;