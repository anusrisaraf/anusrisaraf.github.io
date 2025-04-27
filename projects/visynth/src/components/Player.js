import React from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';

const Player = ({ token, trackUri }) => {
  if (!token) return null;
  
  return (
    <SpotifyPlayer
      token={token}
      uris={trackUri ? [trackUri] : []}
      styles={{
        activeColor: '#1DB954',
        bgColor: '#282c34',
        color: '#fff',
        loaderColor: '#1DB954',
        sliderColor: '#1DB954',
        trackArtistColor: '#ccc',
        trackNameColor: '#fff',
      }}
    />
  );
};

export default Player;