// components/AudioWeatherGenerator.js
import React, { useRef, useState, useEffect } from 'react';
import Sketch from 'react-p5';

const AudioWeatherGenerator = ({ audioData, playbackTime, mediaFile, weatherType = 'responsive' }) => {
  // Canvas references
  const canvasParentRef = useRef(null);
  
  // Audio features state
  const [audioFeatures, setAudioFeatures] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    amplitude: 0,
    // Dynamic parameters for beat detection
    energy: 0,
    beatDetected: false,
    lastBeatTime: 0
  });
  
  // Weather elements collections
  const cloudsRef = useRef([]);
  const raindropsRef = useRef([]);
  const snowflakesRef = useRef([]);
  const lightningBoltsRef = useRef([]);
  const starsRef = useRef([]);
  
  // Weather parameters
  const weatherSettingsRef = useRef({
    // Time settings based on audio mood
    dayProgress: 0.5, // 0 to 1 (dawn to dusk)
    
    // Sky colors for different moods
    skyColors: {
      calm: [
        [135, 206, 235], // Sky blue
        [100, 180, 255]  // Deeper blue
      ],
      energetic: [
        [255, 183, 77],  // Orange
        [255, 111, 97],  // Pinkish
        [45, 50, 80]     // Dark blue
      ],
      melancholic: [
        [100, 120, 150], // Cool blue
        [70, 90, 120]    // Deeper cool blue
      ],
      dark: [
        [50, 50, 80],    // Dark blue
        [20, 20, 40]     // Almost black
      ],
      intense: [
        [70, 80, 100],   // Dark gray
        [40, 45, 60]     // Almost black
      ]
    },
    
    // Cloud settings
    cloudCount: 0,
    maxClouds: 20,
    
    // Rain settings
    rainCount: 0,
    maxRain: 500,
    
    // Snow settings
    snowCount: 0,
    maxSnow: 300,
    
    // Star settings
    starCount: 0,
    maxStars: 200,
    
    // Lightning settings
    lightningChance: 0,
    
    // Sun and moon
    celestialRadius: 40,
    celestialColor: [255, 255, 200],
    
    // Wind settings
    windSpeed: 0,
    windDirection: 0,
    
    // Ground settings
    groundHeight: 0.2, // Percentage of canvas height
    
    // Animation settings
    noiseOffset: 0,
    
    // Rain puddles (for visual feedback on beat)
    puddles: []
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
      
      // Simple beat detection
      const energy = bassAvg / 255;
      const energyThreshold = 0.6; // Threshold for beat detection
      const minBeatInterval = 250; // Minimum time between beats (ms)
      
      // Check if this is a beat
      const now = Date.now();
      const timeSinceLastBeat = now - audioFeatures.lastBeatTime;
      
      let beatDetected = false;
      let lastBeatTime = audioFeatures.lastBeatTime;
      
      if (energy > energyThreshold && timeSinceLastBeat > minBeatInterval) {
        beatDetected = true;
        lastBeatTime = now;
      }
      
      // Normalize values (0-1)
      setAudioFeatures({
        bass: bassAvg / 255,
        mid: midAvg / 255,
        treble: trebleAvg / 255,
        amplitude: amplitude / 255,
        energy,
        beatDetected,
        lastBeatTime
      });
    };
    
    extractFeatures();
  }, [audioData]);
  
  // Update weather settings based on audio features
  useEffect(() => {
    if (!audioData) return;
    
    const settings = weatherSettingsRef.current;
    const { bass, mid, treble, amplitude, beatDetected } = audioFeatures;
    
    // Base sky color on overall mood of the music
    if (bass > 0.7 && amplitude > 0.6) {
      // Intense, heavy music
      settings.currentSkyColors = settings.skyColors.intense;
      settings.dayProgress = 0.9; // Near night
    } else if (bass > 0.5 && mid < 0.4) {
      // Dark, bass-heavy
      settings.currentSkyColors = settings.skyColors.dark;
      settings.dayProgress = 0.8; // Evening
    } else if (treble > 0.6 && mid > 0.5) {
      // Bright, energetic music
      settings.currentSkyColors = settings.skyColors.energetic;
      settings.dayProgress = 0.3; // Morning
    } else if (mid > 0.4 && treble > 0.3 && bass < 0.4) {
      // Balanced, calm music
      settings.currentSkyColors = settings.skyColors.calm;
      settings.dayProgress = 0.5; // Midday
    } else {
      // Mellower music
      settings.currentSkyColors = settings.skyColors.melancholic;
      settings.dayProgress = 0.7; // Late afternoon
    }
    
    // Control weather elements based on audio
    
    // Clouds - controlled by midrange frequencies
    settings.maxClouds = Math.floor(5 + mid * 25);
    
    // Rain - appears with higher bass
    settings.maxRain = Math.floor(bass * 1000);
    
    // Wind speed - controlled by treble
    settings.windSpeed = 0.1 + treble * 2;
    
    // Lightning - triggered by strong bass hits
    settings.lightningChance = bass > 0.7 ? 0.05 * bass : 0;
    
    // Stars - appear with higher treble in darker settings
    settings.maxStars = Math.floor(treble * 300);
    
    // Celestial object (sun/moon) color - based on frequencies
    const r = 200 + Math.floor(bass * 55);
    const g = 200 + Math.floor(mid * 55);
    const b = 200 + Math.floor(treble * 55);
    settings.celestialColor = [r, g, b];
    
    // React to beats
    if (beatDetected) {
      // Create visual reactions to beats
      
      // 1. Lightning on strong beats
      if (bass > 0.7) {
        createLightningBolt();
      }
      
      // 2. Create rain splash/puddle on beats
      if (bass > 0.5) {
        const puddle = {
          x: Math.random() * canvasParentRef.current.offsetWidth,
          y: canvasParentRef.current.offsetHeight * (1 - settings.groundHeight),
          size: 5 + 40 * bass,
          opacity: 0.7,
          fadeSpeed: 0.02
        };
        settings.puddles.push(puddle);
      }
      
      // 3. Pulsate clouds on beats
      for (const cloud of cloudsRef.current) {
        cloud.pulseSize = 1.3;
        cloud.pulseSpeed = 0.05;
      }
    }
    
  }, [audioFeatures, audioData]);
  
  // p5.js setup function
  const setup = (p5, canvasParentRef) => {
    // Create canvas
    const canvas = p5.createCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6);
    canvas.parent(canvasParentRef);
    canvasParentRef.current = canvasParentRef;
    
    // Set initial weather
    initializeWeatherElements(p5);
  };
  
  // Initialize weather elements
  const initializeWeatherElements = (p5) => {
    const settings = weatherSettingsRef.current;
    
    // Initialize stars
    for (let i = 0; i < 50; i++) {
      starsRef.current.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height * (1 - settings.groundHeight)),
        size: p5.random(1, 3),
        brightness: p5.random(100, 255),
        twinkleSpeed: p5.random(0.01, 0.05)
      });
    }
    settings.starCount = 50;
    
    // Create initial clouds
    for (let i = 0; i < 5; i++) {
      addCloud(p5);
    }
  };
  
  // p5.js draw function
  const draw = (p5) => {
    const settings = weatherSettingsRef.current;
    const { bass, mid, treble, amplitude } = audioFeatures;
    
    // Update animation values
    settings.noiseOffset += 0.002 + amplitude * 0.01;
    
    // Clear with alpha for trails based on treble (higher treble = clearer)
    p5.background(0, 0, 0, 150 + treble * 100);
    
    // Draw sky gradient based on audio mood
    drawSky(p5);
    
    // Draw stars - more visible with higher treble
    const starOpacity = treble * 255;
    drawStars(p5, starOpacity);
    
    // Draw celestial body (sun/moon) - pulsing with the beat
    drawCelestialBody(p5);
    
    // Draw clouds - controlled by midrange frequencies
    updateAndDrawClouds(p5);
    
    // Generate raindrops with bass
    if (bass > 0.4 && p5.random() < bass * 0.3) {
      for (let i = 0; i < bass * 5; i++) {
        addRaindrop(p5);
      }
    }
    
    // Update and draw rain
    if (raindropsRef.current.length > 0) {
      updateAndDrawRain(p5);
    }
    
    // Lightning - triggered by strong bass hits
    if (p5.random() < settings.lightningChance) {
      createLightningBolt(p5);
    }
    
    // Draw any active lightning
    drawLightning(p5);
    
    // Draw ground/horizon
    drawGround(p5);
    
    // Draw puddles (beat reactions)
    drawPuddles(p5);
    
    // Display track info when playing
    if (mediaFile) {
      drawTrackInfo(p5, mediaFile, playbackTime);
    }
  };
  
  // Draw sky gradient based on audio mood
  const drawSky = (p5) => {
    const settings = weatherSettingsRef.current;
    const { amplitude } = audioFeatures;
    
    // Get current colors based on audio mood
    const colors = settings.currentSkyColors || settings.skyColors.calm;
    
    // Draw gradient
    for (let y = 0; y < p5.height * (1 - settings.groundHeight); y++) {
      const inter = p5.map(y, 0, p5.height * (1 - settings.groundHeight), 0, 1);
      
      // Interpolate between colors
      let c;
      if (colors.length === 2) {
        c = p5.lerpColor(
          p5.color(colors[0][0], colors[0][1], colors[0][2]),
          p5.color(colors[1][0], colors[1][1], colors[1][2]),
          inter
        );
      } else if (colors.length === 3) {
        if (inter < 0.5) {
          c = p5.lerpColor(
            p5.color(colors[0][0], colors[0][1], colors[0][2]),
            p5.color(colors[1][0], colors[1][1], colors[1][2]),
            inter * 2
          );
        } else {
          c = p5.lerpColor(
            p5.color(colors[1][0], colors[1][1], colors[1][2]),
            p5.color(colors[2][0], colors[2][1], colors[2][2]),
            (inter - 0.5) * 2
          );
        }
      }
      
      p5.stroke(c);
      p5.line(0, y, p5.width, y);
    }
  };
  
  // Draw celestial body (sun/moon) that reacts to audio
  const drawCelestialBody = (p5) => {
    const settings = weatherSettingsRef.current;
    const { amplitude, bass, beatDetected } = audioFeatures;
    
    // Calculate position based on current sky "time"
    let progress = settings.dayProgress;
    const baseRadius = settings.celestialRadius;
    
    // Size pulses with amplitude
    const radius = baseRadius * (1 + amplitude * 0.5);
    
    // Calculate arc path
    const x = p5.map(progress, 0, 1, -radius, p5.width + radius);
    const y = p5.map(
      Math.sin(progress * Math.PI), 
      0, 1, 
      p5.height * (1 - settings.groundHeight) + radius, 
      radius * 2
    );
    
    // Get color from settings (influenced by audio)
    const [r, g, b] = settings.celestialColor;
    
    // Pulse on beat
    const beatEffect = beatDetected ? 1.5 : 1;
    
    // Draw glowing effect
    for (let i = 5; i > 0; i--) {
      const alphaBase = p5.map(i, 5, 0, 10, 70);
      const alpha = alphaBase * (bass * 0.5 + 0.5); // Bass influences glow
      p5.fill(r, g, b, alpha);
      p5.noStroke();
      p5.ellipse(x, y, radius * beatEffect * i / 2.5);
    }
    
    // Draw core
    p5.fill(r, g, b);
    p5.ellipse(x, y, radius * beatEffect);
  };
  
  // Draw and update stars
  const drawStars = (p5, opacity) => {
    const stars = starsRef.current;
    const { treble } = audioFeatures;
    
    p5.noStroke();
    
    // Add stars based on treble
    if (p5.random() < treble * 0.1) {
      const settings = weatherSettingsRef.current;
      if (stars.length < settings.maxStars) {
        stars.push({
          x: p5.random(p5.width),
          y: p5.random(p5.height * (1 - settings.groundHeight)),
          size: p5.random(1, 3),
          brightness: p5.random(100, 255),
          twinkleSpeed: p5.random(0.01, 0.05)
        });
        settings.starCount++;
      }
    }
    
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      
      // Twinkle effect enhanced by treble
      const twinkleFactor = 1 + treble * 2;
      const brightness = star.brightness + 
        Math.sin(p5.frameCount * star.twinkleSpeed * twinkleFactor) * 50;
      
      // Stars more visible with higher treble
      const starOpacity = Math.min(brightness, opacity);
      
      p5.fill(255, 255, 255, starOpacity);
      p5.ellipse(star.x, star.y, star.size * (1 + treble * 0.5));
    }
  };
  
  // Add a new cloud
  const addCloud = (p5) => {
    const settings = weatherSettingsRef.current;
    const { mid } = audioFeatures;
    
    if (settings.cloudCount >= settings.maxClouds) return;
    
    // Cloud properties affected by mid frequencies
    const cloudHeight = p5.random(
      p5.height * 0.1, 
      p5.height * (1 - settings.groundHeight) * 0.7
    );
    
    const cloudWidth = p5.random(p5.width * 0.1, p5.width * 0.25);
    
    const newCloud = {
      x: settings.windSpeed > 0 ? -cloudWidth : p5.width + cloudWidth,
      y: cloudHeight,
      width: cloudWidth,
      height: cloudWidth * p5.random(0.3, 0.6),
      speed: settings.windSpeed * p5.random(0.5, 1.5),
      segments: Math.floor(p5.random(3, 8)),
      opacity: p5.random(150, 220),
      seed: p5.random(1000),
      pulseSize: 1, // For beat reaction
      pulseSpeed: 0, // Decay rate of pulse
      color: mid > 0.6 ? [255, 200, 200] : [255, 255, 255] // Color based on mid frequencies
    };
    
    cloudsRef.current.push(newCloud);
    settings.cloudCount++;
  };
  
  // Update and draw clouds
  const updateAndDrawClouds = (p5) => {
    const settings = weatherSettingsRef.current;
    const clouds = cloudsRef.current;
    const { mid, amplitude } = audioFeatures;
    
    // Potentially add new cloud based on mid frequencies
    if (settings.cloudCount < settings.maxClouds && p5.random() < 0.01 * mid * 10) {
      addCloud(p5);
    }
    
    // Draw existing clouds
    for (let i = 0; i < clouds.length; i++) {
      const cloud = clouds[i];
      
      // Move cloud based on wind (affected by treble)
      cloud.x += cloud.speed;
      
      // Beat reaction - pulse decay
      if (cloud.pulseSize > 1) {
        cloud.pulseSize -= cloud.pulseSpeed;
        if (cloud.pulseSize < 1) cloud.pulseSize = 1;
      }
      
      // Remove if off screen
      if ((cloud.speed > 0 && cloud.x > p5.width + cloud.width) || 
          (cloud.speed < 0 && cloud.x < -cloud.width)) {
        clouds.splice(i, 1);
        settings.cloudCount--;
        i--;
        continue;
      }
      
      // Draw cloud
      drawCloud(p5, cloud);
      
      // Generate rain from cloud if bass is high
      if (amplitude > 0.4 && p5.random() < 0.1 * amplitude) {
        addRaindrop(p5, cloud);
      }
    }
  };
  
  // Draw a single cloud
  const drawCloud = (p5, cloud) => {
    const { x, y, width, height, segments, opacity, seed, pulseSize, color } = cloud;
    const { mid } = audioFeatures;
    
    p5.noStroke();
    
    // Cloud color influenced by music
    let cloudColor;
    if (color) {
      cloudColor = p5.color(color[0], color[1], color[2], opacity);
    } else {
      // Default cloud color with mid-frequency influence
      const r = 255;
      const g = 255 - Math.floor(mid * 30);
      const b = 255 - Math.floor(mid * 50);
      cloudColor = p5.color(r, g, b, opacity);
    }
    
    p5.fill(cloudColor);
    
    // Draw cloud as a collection of circles
    const segmentWidth = width / segments;
    p5.randomSeed(seed);
    
    for (let i = 0; i < segments; i++) {
      const segX = x + i * segmentWidth;
      const segY = y + p5.random(-height * 0.2, height * 0.2);
      const segSize = p5.random(height * 0.8, height * 1.2) * pulseSize;
      p5.ellipse(segX, segY, segSize);
    }
  };
  
  // Add a raindrop
  const addRaindrop = (p5, cloud) => {
    const settings = weatherSettingsRef.current;
    const { bass, mid } = audioFeatures;
    
    if (settings.rainCount >= settings.maxRain) return;
    
    // Position - either from a cloud or random if no cloud
    let x, y;
    if (cloud) {
      x = p5.random(cloud.x - cloud.width / 2, cloud.x + cloud.width / 2);
      y = cloud.y + cloud.height / 2;
    } else {
      x = p5.random(p5.width);
      y = p5.random(p5.height * 0.3);
    }
    
    // Raindrop properties influenced by bass and mid
    const raindrop = {
      x,
      y,
      length: p5.random(10, 20) * (1 + bass * 0.5),
      speed: p5.random(8, 15) * (1 + bass),
      wind: settings.windSpeed * p5.random(0.5, 1.5),
      opacity: p5.random(150, 220),
      // Color tint based on mid frequencies
      colorTint: mid > 0.6 ? [100, 100, 255] : [200, 200, 255]
    };
    
    raindropsRef.current.push(raindrop);
    settings.rainCount++;
  };
  
  // Update and draw raindrops
  const updateAndDrawRain = (p5) => {
    const settings = weatherSettingsRef.current;
    const raindrops = raindropsRef.current;
    const { bass } = audioFeatures;
    
    p5.strokeWeight(1 + bass * 2); // Thicker raindrops with more bass
    
    for (let i = 0; i < raindrops.length; i++) {
      const drop = raindrops[i];
      
      // Move raindrop
      drop.y += drop.speed;
      drop.x += drop.wind;
      
      // Remove if off screen or hit ground
      if (drop.y > p5.height * (1 - settings.groundHeight) || 
          drop.x < 0 || drop.x > p5.width) {
        
        // Create puddle on impact with ground
        if (drop.y > p5.height * (1 - settings.groundHeight) && 
            drop.y < p5.height * (1 - settings.groundHeight) + 5) {
          
          const puddle = {
            x: drop.x,
            y: p5.height * (1 - settings.groundHeight),
            size: 5 + Math.random() * 15,
            opacity: 0.5,
            fadeSpeed: 0.01
          };
          settings.puddles.push(puddle);
        }
        
        raindrops.splice(i, 1);
        settings.rainCount--;
        i--;
        continue;
      }
      
      // Draw raindrop with color tint from audio
      const [r, g, b] = drop.colorTint || [200, 200, 255];
      p5.stroke(r, g, b, drop.opacity);
      p5.line(drop.x, drop.y, drop.x + drop.wind, drop.y + drop.length);
    }
  };
  
  // Create a lightning bolt
  const createLightningBolt = (p5) => {
    if (!p5) return; // Safety check
    
    const settings = weatherSettingsRef.current;
    const { bass, amplitude } = audioFeatures;
    
    // Create lightning bolt
    const boltStartX = p5.random(p5.width);
    const boltStartY = p5.height * 0.1;
    
    const bolt = {
      segments: [],
      opacity: 255,
      fadeSpeed: 15 + bass * 10,
      timeToLive: 5,
      // Color influenced by audio
      color: bass > 0.7 ? [255, 200, 150] : [220, 220, 255]
    };
    
    // Generate lightning path
    let currentX = boltStartX;
    let currentY = boltStartY;
    const groundY = p5.height * (1 - settings.groundHeight);
    
    // Main bolt - jaggedness affected by amplitude
    while (currentY < groundY) {
      const jaggedness = 30 + amplitude * 50;
      const nextX = currentX + p5.random(-jaggedness, jaggedness);
      const nextY = currentY + p5.random(20, 50);
      
      bolt.segments.push({
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY
      });
      
      currentX = nextX;
      currentY = nextY;
      
      // Chance to create a branch - more likely with higher amplitude
      if (p5.random() < 0.2 + amplitude * 0.3) {
        let branchX = currentX;
        let branchY = currentY;
        const branchLength = Math.floor(p5.random(2, 5));
        
        for (let i = 0; i < branchLength; i++) {
          const branchJaggedness = 30 + amplitude * 40;
          const nextBranchX = branchX + p5.random(-branchJaggedness, branchJaggedness);
          const nextBranchY = branchY + p5.random(10, 30);
          
          bolt.segments.push({
            x1: branchX,
            y1: branchY,
            x2: nextBranchX,
            y2: nextBranchY
          });
          
          branchX = nextBranchX;
          branchY = nextBranchY;
          
          if (branchY >= groundY) break;
        }
      }
    }
    
    lightningBoltsRef.current.push(bolt);
    
    // Flash the screen - intensity based on bass
    settings.lightningFlash = 100 + bass * 155;
  };
  
  // Draw lightning
  const drawLightning = (p5) => {
    const settings = weatherSettingsRef.current;
    const bolts = lightningBoltsRef.current;
    
    // Draw lightning flash
    if (settings.lightningFlash > 0) {
      p5.fill(255, 255, 255, settings.lightningFlash);
      p5.rect(0, 0, p5.width, p5.height);
      settings.lightningFlash -= 25;
    }
    
    // Draw lightning bolts
    p5.strokeWeight(3);
    p5.strokeCap(p5.ROUND);
    
    for (let i = 0; i < bolts.length; i++) {
      const bolt = bolts[i];
      const [r, g, b] = bolt.color;
      
      // Draw all segments
      for (const segment of bolt.segments) {
        // Primary bright center
        p5.stroke(r, g, b, bolt.opacity);
        p5.line(segment.x1, segment.y1, segment.x2, segment.y2);
        
        // Outer glow
        p5.strokeWeight(5);
        p5.stroke(r * 0.7, g * 0.7, b * 0.7, bolt.opacity * 0.4);
        p5.line(segment.x1, segment.y1, segment.x2, segment.y2);
        p5.strokeWeight(3);
      }
      
      // Fade out
      bolt.opacity -= bolt.fadeSpeed;
      bolt.timeToLive--;
      
      // Remove if faded out
      if (bolt.opacity <= 0 || bolt.timeToLive <= 0) {
        bolts.splice(i, 1);
        i--;
      }
    }
  };
  
  // Draw ground that reacts to music
  const drawGround = (p5) => {
    const settings = weatherSettingsRef.current;
    const { bass, mid, treble } = audioFeatures;
    const groundStart = p5.height * (1 - settings.groundHeight);
    
    p5.noStroke();
    
    // Ground color influenced by frequencies
    let r, g, b;
    
    if (bass > 0.7) {
      // Dark ground for heavy bass
      r = 40 + bass * 30;
      g = 30 + mid * 30;
      b = 50 + treble * 30;
    } else if (treble > 0.6) {
      // Brighter ground for higher treble
      r = 60 + treble * 40;
      g = 100 + treble * 40;
      b = 60 + mid * 30;
    } else {
      // Default ground
      r = 50 + mid * 30;
      g = 80 + mid * 40;
      b = 50 + bass * 20;
    }
    
    p5.fill(r, g, b);
    p5.rect(0, groundStart, p5.width, p5.height * settings.groundHeight);
    
    // Add texture to ground - density based on mid frequencies
    p5.noStroke();
    const textureCount = 100 + Math.floor(mid * 200);
    
    for (let i = 0; i < textureCount; i++) {
      const x = p5.random(p5.width);
      const y = p5.random(groundStart, p5.height);
      
      p5.fill(r * 0.8, g * 0.8, b * 0.8, 100);
      p5.ellipse(x, y, p5.random(3, 10));
    }
    
    // Draw mountains in background
    drawMountains(p5, groundStart);
  };
  
  // Draw background mountains that react to music
  const drawMountains = (p5, groundLine) => {
    const settings = weatherSettingsRef.current;
    const { bass, mid, treble } = audioFeatures;
    
    p5.noStroke();
    
    // Mountain colors influenced by frequencies
    const mountainLayers = [
      [70 + bass * 50, 80 + mid * 40, 100 + treble * 40, 200],
      [50 + bass * 40, 60 + mid * 30, 90 + treble * 30, 220],
      [30 + bass * 30, 40 + mid * 20, 80 + treble * 20, 255]
    ];
    
    // Draw mountain layers
    for (let layer = 0; layer < 3; layer++) {
      p5.fill(
        mountainLayers[layer][0],
        mountainLayers[layer][1],
        mountainLayers[layer][2],
        mountainLayers[layer][3]
      );
      
      // Generate mountain silhouette
      p5.beginShape();
      p5.vertex(0, groundLine);
      
      // Noise-based mountain generation - jaggedness affected by frequencies
      const layerHeight = p5.map(layer, 0, 2, 0.1, 0.25);
      const points = 100;
      const noiseScale = 0.01 + layer * 0.01;
      
      for (let i = 0; i <= points; i++) {
        const x = p5.map(i, 0, points, 0, p5.width);
        
        // More jagged mountains with higher frequencies
        const jaggedness = 1 + (bass * 0.3 + mid * 0.2 + treble * 0.1);
        const noiseVal = p5.noise(i * noiseScale * jaggedness + layer * 100 + settings.noiseOffset * 0.1);
        
        const y = groundLine - noiseVal * p5.height * layerHeight;
        p5.vertex(x, y);
      }
      
      p5.vertex(p5.width, groundLine);
      p5.endShape(p5.CLOSE);
    }
  };
  
  // Draw puddles (visual beats)
  const drawPuddles = (p5) => {
    const settings = weatherSettingsRef.current;
    
    p5.noStroke();
    
    for (let i = 0; i < settings.puddles.length; i++) {
      const puddle = settings.puddles[i];
      
      // Draw puddle
      p5.fill(100, 150, 255, puddle.opacity * 255);
      p5.ellipse(puddle.x, puddle.y, puddle.size);
      
      // Fade out
      puddle.opacity -= puddle.fadeSpeed;
      
      // Remove if faded out
      if (puddle.opacity <= 0) {
        settings.puddles.splice(i, 1);
        i--;
      }
    }
  };
  
  // Display track information and playback progress
  const drawTrackInfo = (p5, file, currentTime) => {
    if (!file) return;
    
    p5.fill(255, 255, 255, 200);
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
    
    // Audio visualization type
    p5.textAlign(p5.RIGHT, p5.TOP);
    p5.text("Audio Weather Visualizer", p5.width - 20, 20);
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
  
  // p5.js mousePressed function - interact with weather
  const mousePressed = (p5) => {
    const { bass, mid, treble } = audioFeatures;
    
    // Create different weather effects based on current audio features
    if (bass > 0.6) {
      // Create lightning for high bass
      createLightningBolt(p5);
    } else if (mid > 0.6) {
      // Create cloud burst for high mid
      for (let i = 0; i < 10; i++) {
        const newCloud = {
          x: p5.mouseX + p5.random(-100, 100),
          y: p5.mouseY + p5.random(-50, 50),
          width: p5.random(p5.width * 0.05, p5.width * 0.15),
          height: p5.random(p5.height * 0.03, p5.height * 0.08),
          speed: weatherSettingsRef.current.windSpeed * p5.random(0.5, 1.5),
          segments: Math.floor(p5.random(3, 8)),
          opacity: p5.random(150, 220),
          seed: p5.random(1000),
          pulseSize: 1.5,
          pulseSpeed: 0.02,
          color: [255, 255 - mid * 50, 255 - mid * 100]
        };
        
        cloudsRef.current.push(newCloud);
        weatherSettingsRef.current.cloudCount++;
      }
    } else if (treble > 0.6) {
      // Create star burst for high treble
      for (let i = 0; i < 20; i++) {
        starsRef.current.push({
          x: p5.mouseX + p5.random(-100, 100),
          y: p5.mouseY + p5.random(-100, 100),
          size: p5.random(1, 4),
          brightness: p5.random(150, 255),
          twinkleSpeed: p5.random(0.02, 0.08)
        });
        weatherSettingsRef.current.starCount++;
      }
    } else {
      // Default: rain splash
      for (let i = 0; i < 20; i++) {
        addRaindrop(p5);
      }
    }
  };
  
  return (
    <div ref={canvasParentRef} style={{ width: '100%', height: '100%' }}>
      <Sketch 
        setup={setup} 
        draw={draw} 
        windowResized={windowResized}
        mousePressed={mousePressed}
      />
    </div>
  );
};

export default AudioWeatherGenerator;