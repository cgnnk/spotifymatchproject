import React, { useState, useEffect } from 'react';

const App = () => {
    const [token, setToken] = useState('');
    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const _token = hash.split('&')[0].split('=')[1];
            setToken(_token);
            fetchTopTracks(_token);
        }
    }, []);

    const fetchTopTracks = async (t) => {
        const res = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
            headers: { Authorization: `Bearer ${t}` }
        });
        const data = await res.json();
        setTracks(data.items);
    };

    const playTrack = (uri) => {
        fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [uri] }),
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-10 font-sans">
            <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-5">
                <h1 className="text-3xl font-bold italic tracking-tighter">OUR BEATS ✨</h1>
                {!token ? (
                    <a href="http://localhost:8888/login" className="bg-green-500 px-6 py-2 rounded-full font-bold">Spotify ile Bağlan</a>
                ) : (
                    <span className="text-green-400">Oturum Açıldı</span>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tracks.map((track) => (
                    <div key={track.id} className="bg-gray-900 p-4 rounded-xl hover:bg-gray-800 transition cursor-pointer" onClick={() => playTrack(track.uri)}>
                        <img src={track.album.images[0].url} alt={track.name} className="rounded-lg shadow-lg mb-4" />
                        <h3 className="font-bold text-lg truncate">{track.name}</h3>
                        <p className="text-gray-400">{track.artists[0].name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;