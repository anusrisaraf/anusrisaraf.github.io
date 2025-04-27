// App.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './Landing';
import FileUpload from './components/FileUpload';
import AudioPlayer from './components/AudioPlayer';
import './App.css';
import SandballTrapNation3D from './components/SandballTrapNation3D';
import AudioFish from './components/AudioFish';
import FishPanel from './components/FishPanel';
import DitherPanel from './components/DitherPanel';
import AudioDitherPanel from './components/DitherVis';
import { Menu, X, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

function ToolbarButton({ className, children, ...props }) {
  const btnRef = useRef(null);
  function handleMouseMove(e) {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--btn-cursor-x', `${x}%`);
    btn.style.setProperty('--btn-cursor-y', `${y}%`);
  }
  function handleMouseLeave() {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.removeProperty('--btn-cursor-x');
    btn.style.removeProperty('--btn-cursor-y');
  }
  return (
    <button
      ref={btnRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}

function MainApp() {
  // For Dither tab: manage image state and dithering algorithm here
  const [ditherImageUrl, setDitherImageUrl] = useState("");
  const [ditherAlgorithm, setDitherAlgorithm] = useState("threshold");
  const [color0, setColor0] = useState("#000000");
  const [color1, setColor1] = useState("#ffffff");
  const [ditherMode, setDitherMode] = useState('bw');
  const [numColors, setNumColors] = useState(8);
  const handleDitherImageChange = (objectUrl) => {
    setDitherImageUrl(objectUrl);
  };
  const navigate = useNavigate();
  const [visynthHover, setVisynthHover] = useState(false);

  // Drawer state (only for mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    };

    // Set body overflow based on drawer state
    document.body.style.overflow = "hidden";
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, []);

  const toggleDrawer = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    }
  };

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    if (isMobile) {
      setMenuOpen(!menuOpen);
    }
  };

  const [sandballMode, setSandballMode] = useState('center');
  const [inputSource, setInputSource] = useState('file'); // 'file', 'device', or 'mic'

  const [selectedTab, setSelectedTab] = useState('sandball'); // 'sandball', 'plants', or 'dither'
  const [mediaFile, setMediaFile] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [glow, setGlow] = useState(0.5);
  const [spin, setSpin] = useState(0);
  const [smooth, setSmooth] = useState(false);
  const [pointSize, setPointSize] = useState(0.045);
  const [fishCount, setFishCount] = useState(5);

  const handleFileLoaded = (fileData) => {
    setMediaFile(fileData);
    setLoading(true);
  };

  const handleAudioData = (data) => {
    setAudioData(data);
    setLoading(false);
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  const memoizedAudioData = useMemo(() => audioData, [audioData]);
  // Update canvas size calculation
  const getCanvasSize = () => {
    if (isMobile) {
      return window.innerWidth; // Full width for mobile
    } else {
      return Math.min(600, window.innerWidth * 0.6); // For desktop
    }
  };
  const canvasSize = getCanvasSize();
  
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />;
  }

  // Render mobile or desktop layout
  if (isMobile) {
    return (
      <div className="App sandball-landing">
        {/* Fixed VISYNTH header with buttons */}
        <header className="visynth-header">
          <div className="toolbar-flex">
            <div className="header-left">
              <span
                className={`visynth-title${visynthHover ? ' visynth-title-gradient' : ''}`}
                onMouseEnter={() => setVisynthHover(true)}
                onMouseLeave={() => setVisynthHover(false)}
                onClick={() => setShowLanding(true)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                VISYNTH
              </span>
            </div>
            
            <div className="header-right">
              {/* Controls drawer toggle button - mobile only */}
              <button 
                className="control-toggle-btn" 
                onClick={toggleDrawer}
                aria-label={drawerOpen ? "Close controls" : "Open controls"}
              >
                <Sliders size={22} />
                {drawerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {/* Hamburger menu */}
              <button 
                className="menu-toggle-btn" 
                onClick={toggleMenu}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </header>
        
        {/* Mobile Menu Drawer - full screen with logo */}
        <div className={`mobile-menu-drawer ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <span
              className={`visynth-title menu-logo${visynthHover ? ' visynth-title-gradient' : ''}`}
              onMouseEnter={() => setVisynthHover(true)}
              onMouseLeave={() => setVisynthHover(false)}
              onClick={() => setShowLanding(true)}
              style={{ cursor: 'pointer', userSelect: 'none', margin: '30px 0' }}
            >
              VISYNTH
            </span>
            
            <button 
              className={`mobile-menu-item ${selectedTab === 'sandball' ? 'active sandball' : ''}`}
              onClick={() => handleTabSelect('sandball')}
            >
              sandball
            </button>
            <button 
              className={`mobile-menu-item ${selectedTab === 'plants' ? 'active plants' : ''}`}
              onClick={() => handleTabSelect('plants')}
            >
              flutterfish
            </button>
            <button 
              className={`mobile-menu-item ${selectedTab === 'dither' ? 'active dither' : ''}`}
              onClick={() => handleTabSelect('dither')}
            >
              dither
            </button>
            
            <button 
              className="mobile-menu-close" 
              onClick={toggleMenu}
            >
              close
            </button>
          </div>
        </div>
        
        {/* Mobile Controls Drawer */}
        <div className={`controls-drawer ${drawerOpen ? 'open' : ''}`}>
          <div className="drawer-content">
            {selectedTab === 'sandball' ? (
              <>{inputSource === 'file' && mediaFile && (
                <div style={{ margin: '0px 0 0 0' }}>
                  <AudioPlayer
                    mediaFile={mediaFile}
                    onAudioData={handleAudioData}
                    onPlaybackTime={() => {}}
                  />
                </div>
              )}
                {inputSource === 'file' && <FileUpload onFileLoaded={handleFileLoaded} file={mediaFile} />}
                
                <label style={{ color: 'white', marginTop: '9px', display: 'block' }}>
                  point size:
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.001}
                    value={pointSize}
                    onChange={(e) => setPointSize(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <label style={{ color: 'white', marginTop: 0, display: 'block' }}>
                  glow:
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={glow}
                    onChange={(e) => setGlow(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <label style={{ color: 'white', marginTop: 0, display: 'block' }}>
                  spin:
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={spin}
                    onChange={(e) => setSpin(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <button
                  className="balloon-disc-btn"
                  onClick={() => setSandballMode(m => m === 'bottom' ? 'center' : 'bottom')}
                >
                  {sandballMode === 'bottom' ? 'balloon' : 'disc'}
                </button>
                <div style={{ color: 'white', marginTop: '18px', display: 'block' }}>
                  Once you've uploaded a file, explore the buttons and sliders to discover the 3D ball visualization of the sound, and click+drag on the canvas to change the camera angle!
                </div>
              </>
            ) : selectedTab === 'plants' ? (
              <FishPanel
                inputSource={inputSource}
                onFileLoaded={handleFileLoaded}
                mediaFile={mediaFile}
                audioData={audioData}
                AudioPlayer={AudioPlayer}
                handleAudioData={handleAudioData}
                fishCount={fishCount}
                onFishCountChange={setFishCount}
              />
            ) : (
               <DitherPanel
                 onFileLoaded={handleFileLoaded}
                 mediaFile={mediaFile}
                 audioData={audioData}
                 AudioPlayerComponent={AudioPlayer}
                 handleAudioData={handleAudioData}
                 onImageChange={handleDitherImageChange}
                 imageUrl={ditherImageUrl}
                 algorithm={ditherAlgorithm}
                 setAlgorithm={setDitherAlgorithm}
                 color0={color0}
                 color1={color1}
                 setColor0={setColor0}
                 setColor1={setColor1}
                 ditherMode={ditherMode}
                 setDitherMode={setDitherMode}
                 numColors={numColors}
                 setNumColors={setNumColors}
               />
            )}
          </div>
        </div>
        
        <div className="sandball-visual">
          {loading ? (
            <div style={{ color: 'white', textAlign: 'center', fontSize: '1.2rem' }}>waiting for track...</div>
          ) : (
            selectedTab === 'sandball' ? (
              <SandballTrapNation3D
                audioData={memoizedAudioData}
                width={canvasSize}
                height={canvasSize}
                glow={glow}
                spin={spin}
                smooth={smooth}
                pointSize={pointSize}
                mode={sandballMode}
              />
            ) : selectedTab === 'plants' ? (
              <AudioFish
                audioData={memoizedAudioData}
                width={canvasSize}
                height={canvasSize}
                fishCount={fishCount}
              />
            ) : (
               <AudioDitherPanel
                 audioData={memoizedAudioData}
                 imageUrl={ditherImageUrl}
                 algorithm={ditherAlgorithm === 'floyd-steinberg' ? 'floyd' : ditherAlgorithm}
                 color0={color0}
                 color1={color1}
                 ditherMode={ditherMode}
                 numColors={numColors}
               />
            )
          )}
        </div>
      </div>
    );
  } else {
    // Original desktop layout - unchanged
    return (
      <div className="App sandball-landing">
        {/* Fixed VISYNTH header with buttons */}
        <header className="visynth-header">
          <div className="toolbar-flex">
            <span
              className={`visynth-title${visynthHover ? ' visynth-title-gradient' : ''}`}
              onMouseEnter={() => setVisynthHover(true)}
              onMouseLeave={() => setVisynthHover(false)}
              onClick={() => setShowLanding(true)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              VISYNTH
            </span>
            <div className="toolbar-btn-group">
              <ToolbarButton
                onClick={() => setSelectedTab('sandball')}
                className={`toolbar-btn sandball${selectedTab === 'sandball' ? ' active' : ''}`}
              >
                sandball
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setSelectedTab('plants')}
                className={`toolbar-btn plants${selectedTab === 'plants' ? ' active' : ''}`}
              >
                flutterfish
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setSelectedTab('dither')}
                className={`toolbar-btn dither${selectedTab === 'dither' ? ' active' : ''}`}
              >
                dither
              </ToolbarButton>
            </div>
          </div>
        </header>
        
        <main className="sandball-main">
          <div className="sandball-controls">
            {selectedTab === 'sandball' ? (
              <>{inputSource === 'file' && mediaFile && (
                <div style={{ margin: '0px 0 0 0' }}>
                  <AudioPlayer
                    mediaFile={mediaFile}
                    onAudioData={handleAudioData}
                    onPlaybackTime={() => {}}
                  />
                </div>
              )}
                {inputSource === 'file' && <FileUpload onFileLoaded={handleFileLoaded} file={mediaFile} />}
                
                <label style={{ color: 'white', marginTop: '9px', display: 'block' }}>
                  point size:
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.001}
                    value={pointSize}
                    onChange={(e) => setPointSize(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <label style={{ color: 'white', marginTop: 0, display: 'block' }}>
                  glow:
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={glow}
                    onChange={(e) => setGlow(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <label style={{ color: 'white', marginTop: 0, display: 'block' }}>
                  spin:
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={spin}
                    onChange={(e) => setSpin(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    className="sandball-slider"
                  />
                </label>
                <button
                  className="balloon-disc-btn"
                  onClick={() => setSandballMode(m => m === 'bottom' ? 'center' : 'bottom')}
                >
                  {sandballMode === 'bottom' ? 'balloon' : 'disc'}
                </button>
                <div style={{ color: 'white', marginTop: '18px', display: 'block' }}>
                  Once you've uploaded a file, explore the buttons and sliders to discover the 3D ball visualization of the sound, and click+drag on the canvas to change the camera angle!
                </div>
              </>
            ) : selectedTab === 'plants' ? (
              <FishPanel
                inputSource={inputSource}
                onFileLoaded={handleFileLoaded}
                mediaFile={mediaFile}
                audioData={audioData}
                AudioPlayer={AudioPlayer}
                handleAudioData={handleAudioData}
                fishCount={fishCount}
                onFishCountChange={setFishCount}
              />
            ) : (
               <DitherPanel
                 onFileLoaded={handleFileLoaded}
                 mediaFile={mediaFile}
                 audioData={audioData}
                 AudioPlayerComponent={AudioPlayer}
                 handleAudioData={handleAudioData}
                 onImageChange={handleDitherImageChange}
                 imageUrl={ditherImageUrl}
                 algorithm={ditherAlgorithm}
                 setAlgorithm={setDitherAlgorithm}
                 color0={color0}
                 color1={color1}
                 setColor0={setColor0}
                 setColor1={setColor1}
                 ditherMode={ditherMode}
                 setDitherMode={setDitherMode}
                 numColors={numColors}
                 setNumColors={setNumColors}
               />
            )}
          </div>
          
          <div className="sandball-visual">
            {loading ? (
              <div style={{ color: 'white', textAlign: 'center', fontSize: '1.2rem' }}>waiting for track...</div>
            ) : (
              selectedTab === 'sandball' ? (
                <SandballTrapNation3D
                  audioData={memoizedAudioData}
                  width={window.innerWidth}
                  height={canvasSize}
                  glow={glow}
                  spin={spin}
                  smooth={smooth}
                  pointSize={pointSize}
                  mode={sandballMode}
                />
              ) : selectedTab === 'plants' ? (
                <AudioFish
                  audioData={memoizedAudioData}
                  width={canvasSize}
                  height={canvasSize}
                  fishCount={fishCount}
                />
              ) : (
                 <AudioDitherPanel
                   audioData={memoizedAudioData}
                   imageUrl={ditherImageUrl}
                   algorithm={ditherAlgorithm === 'floyd-steinberg' ? 'floyd' : ditherAlgorithm}
                   color0={color0}
                   color1={color1}
                   ditherMode={ditherMode}
                   numColors={numColors}
                 />
              )
            )}
          </div>
        </main>
      </div>
    );
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;