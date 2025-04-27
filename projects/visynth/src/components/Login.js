import React from 'react';

const Login = () => {
  const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = window.location.origin;
  const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  const SCOPES = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'streaming'
  ];

  return (
    <div className="login-container">
      <h2>Connect with your Spotify account</h2>
      <p>Login to visualize your favorite tracks</p>
      <a 
        className="login-button"
        href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES.join('%20')}&response_type=token&show_dialog=true`}
      >
        Connect to Spotify
      </a>
    </div>
  );
};

export default Login;