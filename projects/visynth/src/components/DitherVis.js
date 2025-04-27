import React, { useRef, useEffect, useState } from 'react';

export default function AudioDitherPanel({ audioData, imageUrl, algorithm, color0, color1, ditherMode = 'bw', numColors = 8 }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);


  const cachedPalette = useRef(null);
const lastImageDataKey = useRef(null);

  // Load image from imageUrl
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = imageUrl;
  }, [imageUrl]);

  // Helper to check if audioData is present and nonzero
  function hasAudio(audioData) {
    if (!audioData || !Array.isArray(audioData) || audioData.length === 0) return false;
    // If all values are 0 or 128 (silence), treat as no audio
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) sum += audioData[i];
    // For Uint8Array, silence is usually 128
    const avg = sum / audioData.length;
    return avg < 120 || avg > 136; // outside silent band
  }
  // Grayscale helper
  const toGrayscale = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  // Dithering algorithms
  // Helper to convert hex color to [r,g,b]
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  // Helper to quantize a color to the nearest palette color
  function findNearestColor(rgb, palette) {
    let minDist = Infinity;
    let idx = 0;
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i];
      const dist = (rgb[0] - p[0]) ** 2 + (rgb[1] - p[1]) ** 2 + (rgb[2] - p[2]) ** 2;
      if (dist < minDist) {
        minDist = dist;
        idx = i;
      }
    }
    return palette[idx];
  }
  // Generate palette from image data using k-means (simple version)
  function getPalette(imageData, n) {
    // Sample pixels
    const data = imageData.data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 16) {
      pixels.push([data[i], data[i+1], data[i+2]]);
    }
    // K-means++ init
    const palette = [pixels[Math.floor(Math.random() * pixels.length)]];
    while (palette.length < n) {
      let maxDist = -1, nextPixel = null;
      for (const px of pixels) {
        let minDist = Math.min(...palette.map(p => (px[0]-p[0])**2 + (px[1]-p[1])**2 + (px[2]-p[2])**2));
        if (minDist > maxDist) {
          maxDist = minDist;
          nextPixel = px;
        }
      }
      palette.push(nextPixel);
    }
    // Lloyd's step
    for (let iter = 0; iter < 2; iter++) {
      const clusters = Array.from({length: n}, () => []);
      for (const px of pixels) {
        let idx = 0, minDist = Infinity;
        for (let i = 0; i < n; i++) {
          const p = palette[i];
          const dist = (px[0]-p[0])**2 + (px[1]-p[1])**2 + (px[2]-p[2])**2;
          if (dist < minDist) { minDist = dist; idx = i; }
        }
        clusters[idx].push(px);
      }
      for (let i = 0; i < n; i++) {
        if (clusters[i].length) {
          const mean = [0,0,0];
          for (const px of clusters[i]) {
            mean[0] += px[0]; mean[1] += px[1]; mean[2] += px[2];
          }
          palette[i] = mean.map(v => Math.round(v / clusters[i].length));
        }
      }
    }
    return palette;
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
    
  const applyDithering = (imageData, width, height, threshold, algorithm, cachedPalette = null) => {

    const data = imageData.data;
    const rgb0 = hexToRgb(color0);
    const rgb1 = hexToRgb(color1);
    // If color dithering mode, quantize to palette
    // Color dithering with Floyd-Steinberg error diffusion
    if (ditherMode === 'color' && (algorithm === 'floyd' || algorithm === 'floyd-steinberg')) {
      const palette = cachedPalette || getPalette(imageData, numColors);
      // Floyd-Steinberg error diffusion for color
      const getIndex = (x, y) => (y * width + x) * 4;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = getIndex(x, y);
          const oldPixel = [data[i], data[i+1], data[i+2]];
          const newPixel = findNearestColor(oldPixel, palette);
          const error = [
            data[i] - newPixel[0],
            data[i+1] - newPixel[1],
            data[i+2] - newPixel[2],
          ];
          data[i] = newPixel[0]; data[i+1] = newPixel[1]; data[i+2] = newPixel[2];
          // Diffuse error to neighbors
          const diffuse = (dx, dy, factor) => {
            const xi = x + dx;
            const yi = y + dy;
            if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
              const j = getIndex(xi, yi);
              for (let c = 0; c < 3; c++) {
                data[j + c] = Math.max(0, Math.min(255, data[j + c] + error[c] * factor));
              }
            }
          };
          diffuse(1, 0, 7 / 16);
          diffuse(-1, 1, 3 / 16);
          diffuse(0, 1, 5 / 16);
          diffuse(1, 1, 1 / 16);
        }
      }
      // if (ditherMode === 'color') {
      //   const hueShift = (threshold - 128) * 1; // small hue rotation
      //   for (let i = 0; i < data.length; i += 4) {
      //     const [r, g, b] = [data[i], data[i+1], data[i+2]];
      //     const [h, s, l] = rgbToHsl(r, g, b);
      //     const [r2, g2, b2] = hslToRgb((h + hueShift / 360 + 1) % 1, s, l);
      //     data[i] = r2; data[i+1] = g2; data[i+2] = b2;
      //   }
      // }
      
      return imageData;
    }
    // Simple color quantization (no error diffusion)
    // 
    if (ditherMode === 'color' && algorithm === 'threshold') {
      const palette = cachedPalette || getPalette(imageData, numColors);
    
      // Sort the palette from dark to light using grayscale luminance
      const sortedPalette = [...palette].sort(
        (a, b) => toGrayscale(...a) - toGrayscale(...b)
      );
    
      for (let i = 0; i < data.length; i += 4) {
        const gray = toGrayscale(data[i], data[i + 1], data[i + 2]);
    
        // Map grayscale value to index in palette with audio-reactive shift
        const audioShift = ((threshold - 128) / 255) * numColors; // shift up/down palette
        const rawIndex = Math.floor((gray / 255) * numColors + audioShift);
        const paletteIndex = Math.max(0, Math.min(numColors - 1, rawIndex));
    
        const [r, g, b] = sortedPalette[paletteIndex];
        data[i] = r; data[i + 1] = g; data[i + 2] = b;
      }
    
      return imageData;
    }
    // if (ditherMode === 'color' && algorithm === 'bayer') {
    //   const bayerMatrix = [
    //     [0, 128, 32, 160],
    //     [192, 64, 224, 96],
    //     [48, 176, 16, 144],
    //     [240, 112, 208, 80],
    //   ];
    //   const size = 4;
    
    //   const palette = cachedPalette || getPalette(imageData, numColors);
    
    //   // Sort palette by luminance
    //   const sortedPalette = [...palette].sort(
    //     (a, b) => toGrayscale(...a) - toGrayscale(...b)
    //   );
    //   const paletteBrightness = sortedPalette.map(c => toGrayscale(...c));
    //   const minB = Math.min(...paletteBrightness);
    //   const maxB = Math.max(...paletteBrightness);
    
    //   for (let y = 0; y < height; y++) {
    //     for (let x = 0; x < width; x++) {
    //       const i = (y * width + x) * 4;
    //       const thresholdOffset = bayerMatrix[y % size][x % size]; // 0–255
    //       const bayerShift = (thresholdOffset - 128) / 255 / numColors; // ~[-1/n, 1/n]
    
    //       const gray = toGrayscale(data[i], data[i + 1], data[i + 2]);
    
    //       // Normalize image brightness to palette scale
    //       let normalized = (gray - minB) / (maxB - minB);
    
    //       // Add audio and Bayer shift
    //       const audioShift = ((threshold - 128) / 255) * 0.4;
    //       normalized += audioShift + bayerShift;
    
    //       // Clamp
    //       normalized = Math.max(0, Math.min(1, normalized));
    
    //       // Get palette index
    //       let index = Math.floor(normalized * numColors);
    //       index = Math.max(0, Math.min(numColors - 1, index));
    
    //       const [r, g, b] = sortedPalette[index];
    //       data[i] = r;
    //       data[i + 1] = g;
    //       data[i + 2] = b;
    //     }
    //   }
    
    //   return imageData;
    // }
    
    if (ditherMode === 'color') {
      const palette = cachedPalette || getPalette(imageData, numColors);
      for (let i = 0; i < data.length; i += 4) {
        const orig = [data[i], data[i + 1], data[i + 2]];
        const nearest = findNearestColor(orig, palette);
        data[i] = nearest[0];
        data[i + 1] = nearest[1];
        data[i + 2] = nearest[2];
      }
      return imageData;
    }
    
    
    if (algorithm === 'threshold') {
      for (let i = 0; i < data.length; i += 4) {
        const gray = toGrayscale(data[i], data[i+1], data[i+2]);
        const value = gray < threshold ? 0 : 255;
        if (value === 0) {
          data[i] = rgb0[0]; data[i+1] = rgb0[1]; data[i+2] = rgb0[2];
        } else {
          data[i] = rgb1[0]; data[i+1] = rgb1[1]; data[i+2] = rgb1[2];
        }
      }
    } else if (algorithm === 'floyd' || algorithm === 'floyd-steinberg') {
      const getIndex = (x, y) => (y * width + x) * 4;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = getIndex(x, y);
          const oldPixel = toGrayscale(data[i], data[i+1], data[i+2]);
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = oldPixel - newPixel;
          if (newPixel === 0) {
            data[i] = rgb0[0]; data[i+1] = rgb0[1]; data[i+2] = rgb0[2];
          } else {
            data[i] = rgb1[0]; data[i+1] = rgb1[1]; data[i+2] = rgb1[2];
          }
          const diffuse = (dx, dy, factor) => {
            const xi = x + dx;
            const yi = y + dy;
            if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
              const j = getIndex(xi, yi);
              const val = toGrayscale(data[j], data[j+1], data[j+2]) + error * factor;
              const clamped = Math.max(0, Math.min(255, val));
              data[j] = data[j+1] = data[j+2] = clamped;
            }
          };
          diffuse(1, 0, 7 / 16);
          diffuse(-1, 1, 3 / 16);
          diffuse(0, 1, 5 / 16);
          diffuse(1, 1, 1 / 16);
        }
      }
    } else if (algorithm === 'atkinson') {
      const getIndex = (x, y) => (y * width + x) * 4;
      // Make error spread more reactive to audio: higher audio = more spread
      const baseSpread = 8;
      const spread = Math.max(3, Math.min(16, baseSpread + (threshold - 128) / 8));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = getIndex(x, y);
          const oldPixel = toGrayscale(data[i], data[i+1], data[i+2]);
          const newPixel = oldPixel < threshold ? 0 : 255;
          // error spread is now dynamic
          const error = (oldPixel - newPixel) / spread;
          data[i] = data[i+1] = data[i+2] = newPixel;
          const diffuseCoords = [
            [1, 0], [2, 0],
            [-1, 1], [0, 1], [1, 1],
            [0, 2],
          ];
          for (const [dx, dy] of diffuseCoords) {
            const xi = x + dx;
            const yi = y + dy;
            if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
              const j = getIndex(xi, yi);
              const val = toGrayscale(data[j], data[j+1], data[j+2]) + error;
              const clamped = Math.max(0, Math.min(255, val));
              data[j] = data[j+1] = data[j+2] = clamped;
            }
          }
        }
      }
    } else if (algorithm === 'bayer') {
  const bayerMatrix = [
    [0, 128, 32, 160],
    [192, 64, 224, 96],
    [48, 176, 16, 144],
    [240, 112, 208, 80],
  ];
  const size = 4;
  const palette = ditherMode === 'color' ? (cachedPalette || getPalette(imageData, numColors)) : null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const thresholdOffset = bayerMatrix[y % size][x % size];
      const shift = (thresholdOffset - 128) / 64; // in range [-2, +2]

      if (ditherMode === 'color') {
        const r = data[i], g = data[i + 1], b = data[i + 2];

        // Apply a small Bayer-based color nudge *before* quantizing
        const modulated = [
          Math.max(0, Math.min(255, r + shift)),
          Math.max(0, Math.min(255, g + shift)),
          Math.max(0, Math.min(255, b + shift)),
        ];

        const nearest = findNearestColor(modulated, palette);
        data[i] = nearest[0];
        data[i + 1] = nearest[1];
        data[i + 2] = nearest[2];
      } else {
        const gray = toGrayscale(data[i], data[i + 1], data[i + 2]);
        const bayerThreshold = threshold + (thresholdOffset - 128);
        const value = gray < bayerThreshold ? 0 : 255;
        const rgb = value === 0 ? rgb0 : rgb1;
        data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
      }
    }
  }
}
    
    return imageData;
  };


useEffect(() => {
  if (!image || !audioData) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  // Scale image to fit canvas while preserving aspect ratio
  let imgAspect = image.width / image.height;
  let canvasAspect = width / height;
  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgAspect > canvasAspect) {
    drawWidth = width;
    drawHeight = Math.round(width / imgAspect);
    offsetX = 0;
    offsetY = Math.round((height - drawHeight) / 2);
  } else {
    drawHeight = height;
    drawWidth = Math.round(height * imgAspect);
    offsetY = 0;
    offsetX = Math.round((width - drawWidth) / 2);
  }
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  // Only get image data from the drawn region
  let imageData = ctx.getImageData(offsetX, offsetY, drawWidth, drawHeight);
  // When dithering, only process pixels inside the drawn image region
  // After dithering, put the result back only in the drawn region
  // (rest of canvas remains as background)


  // Compute audio-based threshold
  const avgAudioLevel = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
  const ditherThreshold = 128 + ((avgAudioLevel - 128) * 0.5);

  // Create a key to detect changes
  const imageDataKey = `${imageUrl}-${numColors}-${ditherMode}`;
  if (imageDataKey !== lastImageDataKey.current) {
    lastImageDataKey.current = imageDataKey;
    cachedPalette.current = null; // reset cache if something important changed
  }

  // Only regenerate palette if needed
  if (ditherMode === 'color' && !cachedPalette.current) {
    cachedPalette.current = getPalette(imageData, numColors);
  }

  // Dither only the drawn image region
  const dithered = applyDithering(imageData, drawWidth, drawHeight, ditherThreshold, algorithm, cachedPalette.current);
  // Place dithered region back into canvas at correct offset
  ctx.putImageData(dithered, offsetX, offsetY);
}, [image, audioData, algorithm, color0, color1, ditherMode, numColors, imageUrl]);

  return (
    <div style={{ padding: 16, color: 'white', maxWidth: 640, margin: 'auto' }}>
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        style={{ width: '100%', marginTop: 12, borderRadius: 8, background: '#000' }}
      />
      {(!imageUrl) && (
        <div
          style={
            window.innerWidth < 768
              ? {
                padding: 16,
                color: '#aaa',
                textAlign: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                  width: '90vw',
                  height: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.7)'
                }
              : { color: '#aaa', textAlign: 'center', marginTop: 16 }
          }
        >
          upload an image on the left to see the dithered result here.
        </div>
      )}
    </div>
  );
}
