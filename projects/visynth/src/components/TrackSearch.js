import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const TrackSearch = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }

    let timeoutId = setTimeout(() => {
      setLoading(true);
      spotifyApi.searchTracks(search)
        .then(data => {
          setSearchResults(data.tracks.items.slice(0, 10));
          setLoading(false);
        })
        .catch(err => {
          console.error('Error searching tracks:', err);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="track-search">
      <h3>Find a track</h3>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search for a song..."
      />
      
      {loading && <div className="loading">Searching...</div>}
      
      <div className="search-results">
        {searchResults.map(track => (
          <div 
            key={track.id} 
            className="track-item"
            onClick={() => onSelect(track)}
          >
            <img 
              src={track.album.images[0]?.url} 
              alt={track.album.name}
              width="50"
              height="50"
            />
            <div className="track-info">
              <div className="track-name">{track.name}</div>
              <div className="track-artist">{track.artists[0].name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackSearch;
