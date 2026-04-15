import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyDeGgTl_FUeP7Hg5y5uEb3rPYGXU1SIcdA",
  authDomain: "spotifymatchproject.firebaseapp.com",
  databaseURL: "https://spotifymatchproject-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spotifymatchproject",
  storageBucket: "spotifymatchproject.firebasestorage.app",
  messagingSenderId: "525504631473",
  appId: "1:525504631473:web:6c6e2d56e531f966a58890"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const App = () => {
    const [token, setToken] = useState('');
    const [users, setUsers] = useState({});

    const formatTime = (ms) => {
        const mins = Math.floor(ms / 60000);
        const secs = ((ms % 60000) / 1000).toFixed(0);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const _token = new URLSearchParams(hash.substring(1)).get('access_token');
            setToken(_token);
            startPresenceSystem(_token);
        }
    }, []);

    const startPresenceSystem = (t) => {
        db.ref('presence').on('value', snap => setUsers(snap.val() || {}));

        setInterval(async () => {
            try {
                const uRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${t}` } });
                const userData = await uRes.json();
                const sRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${t}` } });
                
                let data = { name: userData.display_name, img: userData.images[0]?.url || "", last_seen: Date.now(), online: true };

                if (sRes.status === 200) {
                    const s = await sRes.json();
                    db.ref('presence/' + userData.id).update({
                        ...data,
                        playing: s.is_playing,
                        song_name: s.item.name,
                        artist_name: s.item.artists.map(a => a.name).join(', '),
                        album_img: s.item.album.images[0]?.url,
                        duration_ms: s.item.duration_ms,
                        progress_ms: s.progress_ms
                    });
                } else {
                    db.ref('presence/' + userData.id).update({ ...data, playing: false });
                }
            } catch (e) {}
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black italic text-green-500 tracking-tighter">SpotifyOnline</h1>
                {!token ? (
                    <a href="https://spotifymatchproject.onrender.com/login" className="bg-green-500 text-black px-8 py-3 rounded-full font-bold uppercase text-sm hover:scale-105 transition">Login with Spotify</a>
                ) : <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Logged</span>}
            </header>

            <h3 className="text-xs font-bold mb-8 opacity-40 uppercase tracking-[0.4em] italic">Listeners</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(users).map(uid => {
                    const u = users[uid];
                    if (Date.now() - u.last_seen > 300000) return null;
                    const prog = u.playing ? (u.progress_ms / u.duration_ms * 100) : 0;

                    return (
                        <div key={uid} className="bg-white/5 p-4 rounded-[24px] flex items-start space-x-4 border border-white/10 shadow-lg relative overflow-hidden transition-all hover:bg-white/10">
                            {/* Avatar Büyütüldü */}
                            <img src={u.img} alt={u.name} className="w-14 h-14 rounded-full border-2 border-green-500/30 flex-shrink-0 object-cover shadow-inner" />
                            
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-lg truncate leading-tight mb-3 mt-1">{u.name}</h3>
                                
                                {/* Ana Görsel (Album Art) - Boyutu Küçültüldü */}
                                <div className="w-full aspect-square max-w-[180px] rounded-xl bg-cover bg-center relative shadow-md mb-3" 
                                     style={{ backgroundImage: `url(${u.playing ? u.album_img : u.img})` }}>
                                    {u.playing && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#080808] animate-pulse" />}
                                </div>

                                {u.playing ? (
                                    <div className="space-y-1">
                                        <p className="text-green-400 text-xs font-bold truncate uppercase">{u.song_name}</p>
                                        <p className="text-gray-400 text-[10px] italic truncate">{u.artist_name}</p>
                                        
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${prog}%` }} />
                                        </div>
                                        {/* Süre Metni Beyazlaştırıldı */}
                                        <div className="text-[10px] text-white/90 font-medium text-right mt-1 font-mono">
                                            {formatTime(u.progress_ms)} <span className="text-gray-500">/</span> {formatTime(u.duration_ms)}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-[10px] mt-1 italic uppercase tracking-wider">Inactive</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default App;
