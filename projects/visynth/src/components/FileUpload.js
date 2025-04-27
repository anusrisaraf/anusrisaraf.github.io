// components/FileUpload.js
import React, { useState, useRef } from 'react';

const FileUpload = ({ onFileLoaded, variant, file }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  // Process the selected audio/video file
  const processFile = (file) => {
    if (!file) return;

    // Check if file is audio or video
    if (!file.type.match('audio.*') && !file.type.match('video.*')) {
      alert('Please select an audio or video file (MP3/MP4)');
      return;
    }


    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);
    
    // Pass file info to parent component
    onFileLoaded({
      file,
      name: file.name,
      type: file.type,
      url: objectUrl
    });
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="file-upload-container" style={{ width: '100%' }}>
      {/* Always render the hidden input so inputRef.current is never null */}
      <input 
        ref={inputRef}
        type="file" 
        accept="audio/*,video/*" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {file ? (
        <div className="file-info">
          {/* <div className="file-name">{file.name}</div> */}
          {/* <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div> */}
          <button 
            className="change-file-btn"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current.value = '';
              onFileLoaded(null);
            }}
          >
            remove file
          </button>
        </div>
      ) : (
        <div 
          className={`dropzone${variant ? ' ' + variant : ''}${dragActive ? ' active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <div className="upload-prompt">
            <div className="upload-icon">
              {/* <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11L12 8 15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16L12 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg> */}
            </div>
            <p className="upload-text">
              drop your audio/video file here <br />
              or click to browse
            </p>
            <p className="upload-hint">
              supports MP3, MP4, WAV, and other audio/video formats
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;