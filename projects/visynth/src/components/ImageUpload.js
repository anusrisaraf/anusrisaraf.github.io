import React, { useState, useRef } from 'react';

const ImageUpload = ({ onImageLoaded, imageUrl, variant }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  // Process the selected image file
  const processFile = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      alert('Please select an image file (PNG/JPG/GIF)');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    onImageLoaded(objectUrl);
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {imageUrl ? (
        <div className="file-info" style={{ textAlign: 'center' }}>
          <img src={imageUrl} alt="Preview" style={{ marginTop: 10, maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #888' }} />
          <button
            className="change-file-btn"
            style={{ display: 'block', margin: '10px auto 0', marginLeft: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current.value = '';
              onImageLoaded(null);
            }}
          >
            remove image
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
          <div className="upload-prompt" style={{ accentColor: 'rgb(33, 42, 132)' }}>
            <div className="upload-icon">
              {/* <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11L12 8 15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16L12 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg> */}
            </div>
            <p className="upload-text">
              drop your image file here<br />
              or click to browse
            </p>
            <p className="upload-hint">
              supports PNG, JPG, GIF and other image formats
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
