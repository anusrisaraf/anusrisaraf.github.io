// components/SandballTrapNation3D.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const NUM_WAVE_POINTS = 128;

const SandballTrapNation3D = ({ audioData, width = 600, height = 600 }) => {
  const mountRef = useRef();
  const requestRef = useRef();
  const controlsRef = useRef();
  const sphereRef = useRef();
  const waveformRef = useRef();
  const audioDataRef = useRef();

  // Keep audioData ref up to date
  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.rotateSpeed = 0.7;
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(5, 8, 8);
    scene.add(dir);

    // Sandball (sphere of points)
    const sandGeometry = new THREE.SphereGeometry(2, 80, 80);
    const sandMaterial = new THREE.PointsMaterial({
      color: 0xffe6b3,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
    });
    const sandball = new THREE.Points(sandGeometry, sandMaterial);
    sphereRef.current = sandball;
    scene.add(sandball);

    // Circular waveform ring
    const waveformGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(NUM_WAVE_POINTS * 3);
    waveformGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const waveformMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffe7,
      linewidth: 2,
    });
    const waveform = new THREE.LineLoop(waveformGeometry, waveformMaterial);
    waveformRef.current = waveform;
    scene.add(waveform);

    // Animation loop
    function animate() {
      const arr = audioDataRef.current?.length
        ? audioDataRef.current
        : Array.from({ length: NUM_WAVE_POINTS }, (_, i) =>
            128 + 64 * Math.sin(performance.now() * 0.002 + i)
          );

      const baseRadius = 2.4;
      const amp = 0.7 + (arr.reduce((a, b) => a + b, 0) / arr.length) / 255 * 0.5;
      const pos = waveform.geometry.attributes.position.array;

      for (let i = 0; i < NUM_WAVE_POINTS; i++) {
        const theta = (i / NUM_WAVE_POINTS) * Math.PI * 2;
        const v = (arr[i % arr.length] - 128) / 128;
        const r = baseRadius + v * amp * 0.7;

        pos[i * 3 + 0] = Math.cos(theta) * r;
        pos[i * 3 + 1] = Math.sin(theta) * r;
        pos[i * 3 + 2] = 0.15 * Math.sin(theta * 2 + performance.now() * 0.002);
      }

      waveform.geometry.attributes.position.needsUpdate = true;

      // Optional: keep waveform in sync with sphere rotation
      waveform.rotation.y = sandball.rotation.y * 1.1;
      waveform.rotation.x = sandball.rotation.x * 1.1;

      controlsRef.current?.update(); // Drag-based camera control
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [width, height]);

  return (
    <div
      ref={mountRef}
      style={{
        width,
        height,
        margin: '0 auto',
        borderRadius: '10px',
        overflow: 'hidden',
        cursor: 'grab',
      }}
    />
  );
};

export default SandballTrapNation3D;
