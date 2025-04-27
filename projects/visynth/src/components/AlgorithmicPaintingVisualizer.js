// components/AlgorithmicPaintingVisualizer.js
import React, { useRef, useState, useEffect } from 'react';
import Sketch from 'react-p5';

const AlgorithmicPaintingVisualizer = ({ audioData, playbackTime, mediaFile, visualMode }) => {
  const canvasParentRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [audioFeatures, setAudioFeatures] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    amplitude: 0
  });

  // Store brush strokes for ongoing painting
  const brushStrokesRef = useRef([]);

  // Painting settings
  const paintingSettingsRef = useRef({
    palette: [], // Will be initialized in setup
    backgroundAlpha: 0.02, // Controls how quickly previous strokes fade
    maxStrokes: 1000, // Maximum number of strokes to keep in memory
    baseBrushSize: 15,
    brushSizeVariance: 30,
    noiseScale: 0.003, // Scale for Perlin noise
    noiseOffset: 0, // Incremented over time for evolving patterns
    textureAlpha: 0.1, // Alpha for the texture overlay
  });

  const textureRef = useRef(null); // Ref to store the canvas texture

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
    // Create canvas
    const canvas = p5.createCanvas(p5.windowWidth * 0.8, p5.windowHeight * 0.6);
    canvas.parent(canvasParentRef);
    canvasParentRef.current = canvasParentRef;

    // Set color mode to HSB
    p5.colorMode(p5.HSB, 1);
    p5.blendMode(p5.BLEND);

    // Initialize color palettes for different modes
    const palettes = {
      impressionist: [
        p5.color(0.58, 0.6, 0.95), // Light blue
        p5.color(0.1, 0.8, 0.95),  // Yellow
        p5.color(0.95, 0.7, 0.8),  // Pink
        p5.color(0.42, 0.7, 0.8),  // Turquoise
        p5.color(0.05, 0.8, 0.9),  // Orange
        p5.color(0.82, 0.5, 0.7)   // Purple
      ],
      expressionist: [
        p5.color(0.05, 0.9, 0.9),  // Bright orange
        p5.color(0.95, 0.8, 0.8),  // Deep pink
        p5.color(0.58, 0.7, 0.6),  // Muted blue
        p5.color(0.12, 0.9, 0.6),  // Dark yellow
        p5.color(0.78, 0.6, 0.9)   // Vibrant purple
      ],
      abstract: [
        p5.color(0, 0, 1),         // White
        p5.color(0, 0, 0),         // Black
        p5.color(0.95, 0.7, 0.9),  // Red
        p5.color(0.58, 0.7, 0.9),  // Blue
        p5.color(0.16, 0.7, 0.9)   // Yellow
      ]
    };

    // Set initial palette
    paintingSettingsRef.current.palette = palettes.impressionist;

    // Create initial background
    p5.background(0.1, 0.05, 0.2); // Dark blue-violet background

    // Create a subtle canvas texture
    const textureCanvas = p5.createGraphics(p5.width, p5.height);
    textureCanvas.loadPixels();
    for (let i = 0; i < textureCanvas.width; i++) {
      for (let j = 0; j < textureCanvas.height; j++) {
        const rand = p5.random(255);
        textureCanvas.pixels[i * 4 * textureCanvas.width + j * 4] = rand;
        textureCanvas.pixels[i * 4 * textureCanvas.width + j * 4 + 1] = rand;
        textureCanvas.pixels[i * 4 * textureCanvas.width + j * 4 + 2] = rand;
        textureCanvas.pixels[i * 4 * textureCanvas.width + j * 4 + 3] = p5.random(20, 40); // Subtle alpha
      }
    }
    textureCanvas.updatePixels();
    textureRef.current = textureCanvas;
  };

  // p5.js draw function
  const draw = (p5) => {
    // Apply semi-transparent background for fading effect
    p5.fill(0.1, 0.05, 0.2, paintingSettingsRef.current.backgroundAlpha);
    p5.noStroke();
    p5.rect(0, 0, p5.width, p5.height);

    if (!audioData || !mediaFile) {
      drawPlaceholder(p5);
      return;
    }

    // Update noise offset for evolving patterns
    paintingSettingsRef.current.noiseOffset += 0.005;

    // Draw based on selected visualization mode
    switch (visualMode) {
      case 'frequency':
        createImpressionist(p5, audioFeatures);
        break;
      case 'waveform':
        createExpressionist(p5, audioFeatures);
        break;
      case 'particles':
        createAbstract(p5, audioFeatures);
        break;
      default:
        createImpressionist(p5, audioFeatures);
    }

    // Display file information
    drawFileInfo(p5, mediaFile, playbackTime);

    // Draw existing brush strokes
    drawBrushStrokes(p5);

    // Overlay subtle texture
    if (textureRef.current) {
      p5.blendMode(p5.OVERLAY);
      p5.tint(255, paintingSettingsRef.current.textureAlpha * 255);
      p5.image(textureRef.current, 0, 0, p5.width, p5.height);
      p5.blendMode(p5.BLEND);
      p5.noTint();
    }
  };

  // Draw existing brush strokes
  const drawBrushStrokes = (p5) => {
    const strokes = brushStrokesRef.current;

    // Draw all active brush strokes
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];

      // Update age and fade
      stroke.age += 1;
      stroke.opacity -= stroke.fadeRate;

      // Remove old strokes
      if (stroke.opacity <= 0) {
        strokes.splice(i, 1);
        i--;
        continue;
      }

      p5.noStroke();
      const c = stroke.color;
      p5.fill(p5.hue(c), p5.saturation(c), p5.brightness(c), stroke.opacity);

      if (stroke.type === 'circle') {
        p5.ellipse(stroke.x, stroke.y, stroke.size, stroke.size * (0.8 + p5.random(0.4))); // Organic ellipse
      } else if (stroke.type === 'line') {
        p5.strokeWeight(stroke.size);
        p5.stroke(p5.hue(c), p5.saturation(c), p5.brightness(c), stroke.opacity);
        // Add slight curve or jitter
        p5.beginShape();
        p5.curveVertex(stroke.x + p5.random(-2, 2), stroke.y + p5.random(-2, 2));
        p5.curveVertex(stroke.x, stroke.y);
        p5.curveVertex(stroke.x2, stroke.y2);
        p5.curveVertex(stroke.x2 + p5.random(-2, 2), stroke.y2 + p5.random(-2, 2));
        p5.endShape();
        p5.noStroke();
      } else if (stroke.type === 'rect') {
        p5.rect(stroke.x, stroke.y, stroke.width, stroke.height);
      } else if (stroke.type === 'splatter') {
        const density = 5 + Math.floor(stroke.size * 0.2);
        for (let j = 0; j < density; j++) {
          const angle = p5.random(p5.TWO_PI);
          const radius = p5.random(stroke.size * 0.5);
          p5.ellipse(stroke.x + Math.cos(angle) * radius, stroke.y + Math.sin(angle) * radius, stroke.detailSize, stroke.detailSize * 0.6);
        }
      } else if (stroke.type === 'bristle') {
        const numBristles = 3 + Math.floor(stroke.size * 0.1);
        for (let j = 0; j < numBristles; j++) {
          const angleOffset = p5.random(-0.2, 0.2);
          const length = stroke.size * (0.6 + p5.random(0.4));
          const endX = stroke.x + Math.cos(stroke.angle + angleOffset) * length;
          const endY = stroke.y + Math.sin(stroke.angle + angleOffset) * length;
          p5.strokeWeight(stroke.thickness * (0.3 + p5.random(0.7)));
          p5.stroke(p5.hue(c), p5.saturation(c), p5.brightness(c), stroke.opacity * (0.5 + p5.random(0.5)));
          p5.line(stroke.x, stroke.y, endX, endY);
        }
        p5.noStroke();
      }
    }
  };

  // Add a new brush stroke
  const addBrushStroke = (p5, type, options) => {
    // Limit number of strokes to prevent memory issues
    if (brushStrokesRef.current.length > paintingSettingsRef.current.maxStrokes) {
      brushStrokesRef.current.shift(); // Remove oldest stroke
    }

    const palette = paintingSettingsRef.current.palette;
    const colorIndex = Math.floor(p5.random(palette.length));
    const baseColor = palette[colorIndex];
    const finalColor = options.colorBlend ? p5.lerpColor(baseColor, options.colorBlend, options.blendFactor || 0.5) : baseColor;

    // Create new stroke with all properties
    const stroke = {
      type,
      color: finalColor,
      opacity: options.opacity || 0.8,
      fadeRate: options.fadeRate || 0.001,
      age: 0,
      ...options
    };

    brushStrokesRef.current.push(stroke);
  };

  // Impressionist style - small, organic brushstrokes with varying colors
  const createImpressionist = (p5, features) => {
    const { bass, mid, treble, amplitude } = features;
    const settings = paintingSettingsRef.current;

    // Set palette for impressionist style
    if (visualMode === 'frequency' && settings.palette !== 'impressionist') {
      settings.palette = [
        p5.color(0.58, 0.6, 0.95), // Light blue
        p5.color(0.1, 0.8, 0.95),  // Yellow
        p5.color(0.95, 0.7, 0.8),  // Pink
        p5.color(0.42, 0.7, 0.8),  // Turquoise
        p5.color(0.05, 0.8, 0.9),  // Orange
        p5.color(0.82, 0.5, 0.7)   // Purple
      ];
    }

    // Number of strokes based on amplitude
    const brushCount = Math.floor(10 + amplitude * 30);

    // Create brushstrokes
    for (let i = 0; i < brushCount; i++) {
      const angle = p5.noise(
        p5.frameCount * 0.015,
        i * 0.3 + settings.noiseOffset
      ) * p5.TWO_PI * 2;

      const centerX = p5.width / 2;
      const centerY = p5.height / 2;

      let distance;
      if (i % 3 === 0) {
        distance = bass * p5.height * 0.4;
      } else if (i % 3 === 1) {
        distance = mid * p5.height * 0.6;
      } else {
        distance = treble * p5.height * 0.8;
      }
      distance *= 0.6 + p5.noise(i * 0.2, p5.frameCount * 0.025) * 0.8;

      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const baseBrushSize = settings.baseBrushSize * (0.4 + amplitude * 0.6);
      const brushSize = baseBrushSize + p5.random(-settings.brushSizeVariance * 0.3, settings.brushSizeVariance * 0.3);

      const opacity = 0.6 + amplitude * 0.4 + p5.random(-0.2, 0.2);
      const fadeRate = 0.004 + 0.02 * p5.random();

      if (p5.random() > 0.8) {
        // Add occasional splatters
        addBrushStroke(p5, 'splatter', {
          x,
          y,
          size: brushSize * 1.5,
          opacity,
          fadeRate,
          detailSize: baseBrushSize * 0.2 + p5.random(3)
        });
      } else {
        addBrushStroke(p5, p5.random() > 0.7 ? 'ellipse' : 'circle', {
          x,
          y,
          size: brushSize * (0.6 + p5.random(0.4)),
          opacity,
          fadeRate,
          colorBlend: brushStrokesRef.current.length > 0 ? brushStrokesRef.current[brushStrokesRef.current.length - 1].color : undefined,
          blendFactor: 0.2 + p5.random(0.3),
          // Add aspect ratio for ellipse
          aspectRatio: 0.7 + p5.random(0.6)
        });
      }
    }
  };

  // Expressionist style - bold, emotional strokes with varied dynamics
  const createExpressionist = (p5, features) => {
    const { bass, mid, treble, amplitude } = features;
    const settings = paintingSettingsRef.current;

    // Set palette for expressionist style
    if (visualMode === 'waveform' && settings.palette !== 'expressionist') {
      settings.palette = [
        p5.color(0.05, 0.9, 0.9),  // Bright orange
        p5.color(0.95, 0.8, 0.8),  // Deep pink
        p5.color(0.58, 0.7, 0.6),  // Muted blue
        p5.color(0.12, 0.9, 0.6),  // Dark yellow
        p5.color(0.78, 0.6, 0.9)   // Vibrant purple
      ];
    }

    // Fewer, but bolder strokes for expressionist style
    const strokeCount = Math.floor(3 + amplitude * 10);

    for (let i = 0; i < strokeCount; i++) {
      const centerX = p5.width / 2;
      const centerY = p5.height / 2;

      const angleBase = p5.noise(i * 0.3, p5.frameCount * 0.008) * p5.TWO_PI;
      const angleVariance = treble * p5.PI * 0.3;
      const finalAngle = angleBase + p5.random(-angleVariance, angleVariance);

      const startDistance = mid * p5.height * 0.3 + p5.random(-50, 50);
      const x1 = centerX + Math.cos(finalAngle) * startDistance;
      const y1 = centerY + Math.sin(finalAngle) * startDistance;

      let strokeLength = 30 + amplitude * 200 + bass * 150;
      strokeLength *= 0.8 + p5.noise(i * 0.4 + 100, p5.frameCount * 0.012) * 0.4;

      const endX = x1 + Math.cos(finalAngle + p5.random(-0.1, 0.1)) * strokeLength;
      const endY = y1 + Math.sin(finalAngle + p5.random(-0.1, 0.1)) * strokeLength;

      const baseThickness = 3 + amplitude * 20 + bass * 15;
      const thickness = baseThickness * (0.7 + p5.random(0.6));

      const opacity = 0.5 + amplitude * 0.5 + p5.random(-0.1, 0.1);
      const fadeRate = 0.002 + bass * 0.008;

      if (p5.random() > 0.7) {
        // Add some bristle-like strokes
        addBrushStroke(p5, 'bristle', {
          x: x1,
          y: y1,
          angle: finalAngle + p5.random(-0.5, 0.5),
          size: thickness * 2,
          thickness: thickness * 0.3,
          opacity,
          fadeRate
        });
      } else {
        addBrushStroke(p5, 'line', {
          x: x1,
          y: y1,
          x2: endX,
          y2: endY,
          size: thickness,
          opacity,
          fadeRate,
          // Introduce slight color variation based on audio
          colorBlend: p5.color(p5.hue(settings.palette[i % settings.palette.length]) + treble * 0.2, p5.saturation(settings.palette[i % settings.palette.length]), p5.brightness(settings.palette[i % settings.palette.length])),
          blendFactor: 0.3 + treble * 0.4
        });
      }
    }
  };

  // Abstract style - geometric shapes and patterns
  const createAbstract = (p5, features) => {
    const { bass, mid, treble, amplitude } = features;
    const settings = paintingSettingsRef.current;

    // Set palette for abstract style
    if (visualMode === 'particles' && settings.palette !== 'abstract') {
      settings.palette = [
        p5.color(0, 0, 1),         // White
        p5.color(0, 0, 0),         // Black
        p5.color(0.95, 0.7, 0.9),  // Red
        p5.color(0.58, 0.7, 0.9),  // Blue
        p5.color(0.16, 0.7, 0.9)   // Yellow
      ];
    }

    // Shapes count based on amplitude
    const shapeCount = Math.floor(3 + amplitude * 12);

    for (let i = 0; i < shapeCount; i++) {
      const shapeType = Math.floor(p5.random(3)); // 0: circle, 1: rectangle, 2: line

      const gridSize = 5;
      const cellWidth = p5.width / gridSize;
      const cellHeight = p5.height / gridSize;

      const cellX = Math.floor(p5.noise(
        bass * p5.frameCount * 0.009 + 200,
        i * 0.15
      ) * gridSize);

      const cellY = Math.floor(p5.noise(
        treble * p5.frameCount * 0.009 + 300,
        i * 0.15 + 100
      ) * gridSize);

      const x = cellX * cellWidth + p5.random(cellWidth);
      const y = cellY * cellHeight + p5.random(cellHeight);

      const sizeBase = 15 + (mid * 60);
      const size = sizeBase * (0.8 + p5.random(0.4));

      const opacity = 0.5 + amplitude * 0.5 + p5.random(-0.2, 0.2);
      const fadeRate = 0.0015 + amplitude * 0.0025;

      if (shapeType === 0) { // Circle
        addBrushStroke(p5, 'circle', {
          x,
          y,
          size,
          opacity,
          fadeRate
        });
      } else if (shapeType === 1) { // Rectangle
        const widthMult = 0.6 + bass * 1.5;
        const heightMult = 0.6 + treble * 1.5;

        addBrushStroke(p5, 'rect', {
          x: x - (size * widthMult) / 2,
          y: y - (size * heightMult) / 2,
          width: size * widthMult,
          height: size * heightMult,opacity,
          fadeRate
        });
      } else { // Line
        const angleBase = p5.noise(i * 0.4 + 400, p5.frameCount * 0.011) * p5.TWO_PI;
        const angleVariance = mid * p5.PI * 0.2;
        const angle = angleBase + p5.random(-angleVariance, angleVariance);
        const length = 20 + amplitude * 80 + treble * 60;

        addBrushStroke(p5, 'line', {
          x,
          y,
          x2: x + Math.cos(angle) * length,
          y2: y + Math.sin(angle) * length,
          size: 1 + mid * 8,
          opacity,
          fadeRate
        });
      }
    }
  };

  // Placeholder visualization when no file is playing
  const drawPlaceholder = (p5) => {
    p5.fill(1, 0, 1, 1);
    p5.textSize(24);
    p5.textAlign(p5.CENTER, p5.CENTER);

    if (!mediaFile) {
      p5.text('Upload an audio file to start painting', p5.width / 2, p5.height / 2);
    } else {
      p5.text('Press play to begin painting with sound', p5.width / 2, p5.height / 2);
    }

    // Create a simple animated brush stroke
    if (p5.frameCount % 30 === 0) {
      const x = p5.width / 2 + (p5.random(2) - 1) * 100;
      const y = p5.height / 2 + (p5.random(2) - 1) * 100;

      addBrushStroke(p5, 'circle', {
        x,
        y,
        size: 20 + p5.random(30),
        opacity: 0.7,
        fadeRate: 0.01
      });
    }
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

    // Visualization mode
    p5.textAlign(p5.RIGHT, p5.TOP);
    let styleName;
    switch (visualMode) {
      case 'frequency':
        styleName = 'Impressionist Style';
        break;
      case 'waveform':
        styleName = 'Expressionist Style';
        break;
      case 'particles':
        styleName = 'Abstract Style';
        break;
      default:
        styleName = 'Impressionist Style';
    }
    p5.text(styleName, p5.width - 20, 20);
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

  // p5.js mousePressed function - add brush stroke on click
  const mousePressed = (p5) => {
    // Only add strokes if audio is playing
    if (!audioData || !mediaFile) return;

    // Create a special brush stroke at mouse position
    const x = p5.mouseX;
    const y = p5.mouseY;

    const palette = paintingSettingsRef.current.palette;
    const color = palette[Math.floor(p5.random(palette.length))];

    // Style depends on current mode
    if (visualMode === 'frequency') {
      // Impressionist - cluster of small organic shapes
      for (let i = 0; i < 8; i++) {
        const size = 5 + p5.random(12);
        addBrushStroke(p5, p5.random() > 0.5 ? 'circle' : 'splatter', {
          x: x + p5.random(-15, 15),
          y: y + p5.random(-15, 15),
          size,
          opacity: 0.6 + p5.random(0.4),
          fadeRate: 0.003,
          detailSize: size * 0.3
        });
      }
    } else if (visualMode === 'waveform') {
      // Expressionist - bold curved line
      const angle = p5.random(p5.TWO_PI);
      const length = 40 + p5.random(80);
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      addBrushStroke(p5, 'line', {
        x,
        y,
        x2: endX,
        y2: endY,
        size: 8 + p5.random(15),
        opacity: 0.7,
        fadeRate: 0.0015
      });
    } else {
      // Abstract - geometric shape with potential rotation
      const size = 25 + p5.random(35);
      if (p5.random() > 0.5) {
        addBrushStroke(p5, 'rect', {
          x: x - size / 2,
          y: y - size / 2,
          width: size + p5.random(-10, 10),
          height: size + p5.random(-10, 10),
          opacity: 0.6,
          fadeRate: 0.0018
        });
      } else {
        addBrushStroke(p5, 'circle', {
          x,
          y,
          size: size * (0.8 + p5.random(0.4)),
          opacity: 0.6,
          fadeRate: 0.0018
        });
      }
    }
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      windowResized={windowResized}
      mousePressed={mousePressed}
    />
  );
};

export default AlgorithmicPaintingVisualizer;