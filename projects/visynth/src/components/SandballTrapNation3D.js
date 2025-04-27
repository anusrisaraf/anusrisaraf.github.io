// SandballTrapNation3D.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import FileUpload from './FileUpload';
const NUM_LAT = 32;
const NUM_LON = 64;
const NUM_POINTS = NUM_LAT * NUM_LON;


const SandballTrapNation3D = ({
  audioData,
  width = 1000,
  height = 1000,
  glow = 0.5,
  spin = 0,
  smooth = false,
  pointSize = 0.045,
  mode = 'bottom', // 'bottom' (bass at bottom) or 'center' (bass at center)
  mediaFile,
  onFileLoaded,
}) => {
  const materialRef = useRef();
  const mountRef = useRef();
  const requestRef = useRef();
  const controlsRef = useRef();
  const audioDataRef = useRef();
  const fallbackArray = useRef(new Uint8Array(NUM_POINTS).fill(128));

  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  // Live update point size
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.size = pointSize;
    }
  }, [pointSize]);

  useEffect(() => {
    const scene = new THREE.Scene();
    // Always use window size
    function setRendererSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      renderer.domElement.style.width = w + 'px';
      renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      bloomPass.setSize(w, h);
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

// Add this in your component's useEffect where the camera is set up
if (window.innerWidth < 768) {
  // Mobile adjustment
  camera.position.z = 10; // Increase distance (makes visualization appear smaller)
  // OR
  camera.fov = 60; // Increase field of view (makes visualization appear smaller)
  camera.updateProjectionMatrix();
}    // Responsive renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';

    if (mountRef.current) {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);
    }

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      glow,
      0.85,
      0.1
    );
    composer.addPass(bloomPass);

    // Responsive resize
    window.addEventListener('resize', setRendererSize);
    setRendererSize();


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = false;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 8);
    scene.add(dir);

    const baseCoords = [];
    const positions = new Float32Array(NUM_POINTS * 3);

    for (let lat = 0; lat < NUM_LAT; lat++) {
      const phi = (Math.PI * lat) / (NUM_LAT - 1);
      for (let lon = 0; lon < NUM_LON; lon++) {
        const theta = (2 * Math.PI * lon) / NUM_LON;
        baseCoords.push({ phi, theta });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffccaa,
      size: pointSize,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialRef.current = material;

    const sandball = new THREE.Points(geometry, material);
    scene.add(sandball);

    const animate = () => {
      const time = performance.now() * 0.002;
      const arr = audioDataRef.current?.length > 0 ? audioDataRef.current : fallbackArray.current;

      const baseRadius = 2.4;
      const amp = 1.3;
      const pos = geometry.attributes.position.array;
      const N = arr.length;

      for (let i = 0; i < NUM_POINTS; i++) {
        const { phi, theta } = baseCoords[i];
        let bandAvg = 0;
        let count = 0;
        let freqIdx;
        if (mode === 'bottom') {
          // Bass at bottom (nonlinear mapping)
          const t = (Math.PI - phi) / Math.PI; // 0 at top, 1 at bottom
          const bassBias = 2.2; // >1 for more bass separation
          freqIdx = Math.round(Math.pow(t, bassBias) * (N - 1));
        } else {
          // Bass at center, but apply bassBias to band mapping
          const bassBias = 1.2; // Same as bottom mode
          const yRatio = Math.abs(Math.cos(phi)); // 0 at equator, 1 at poles
          const band = Math.floor(Math.pow(yRatio, bassBias) * 4); // Power curve for more bass at center
          const bandSize = Math.floor(N / 4);
          const bandStart = band * bandSize;
          const bandEnd = Math.min((band + 1) * bandSize, N);
          for (let j = bandStart; j < bandEnd; j++) bandAvg += arr[j];
          bandAvg /= bandEnd - bandStart || 1;
          let pulse = ((bandAvg - 128) / 128) * 0.5;
          const r = baseRadius + amp * pulse;
          pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.cos(phi);
          pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
          continue;
        }
        // For 'bottom' mode, take a small window around freqIdx for averaging
        const window = 6;
        for (let j = Math.max(0, freqIdx - window); j <= Math.min(N - 1, freqIdx + window); j++) {
          bandAvg += arr[j];
          count++;
        }
        bandAvg /= count || 1;
        let pulse = ((bandAvg - 128) / 128) * 0.5;
        const r = baseRadius + amp * pulse;
        pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi);
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }

      sandball.rotation.y += spin * 0.01;
      geometry.attributes.position.needsUpdate = true;
      bloomPass.strength = glow;
      controlsRef.current?.update();
      composer.render();
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(requestRef.current);
      composer.dispose();
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [width, height, glow, spin, smooth, mode]);

  return (
    <div>
      <FileUpload onFileLoaded={onFileLoaded} variant="sandball" file={mediaFile} />
      <div
        ref={mountRef}
        className="sand"
        style={{
          position: 'fixed',
          top: 0,
          left: '8%',
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          margin: 0,
          padding: 0,
          border: 'none',
          background: 'transparent',
        }}
      />
    </div>
  );
};

export default SandballTrapNation3D;
