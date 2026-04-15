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
                        progress_ms: s.progress_ms,
                        track_id: s.item.id // Spotify linki için gerekli
                    });
                } else {
                    db.ref('presence/' + userData.id).update({ ...data, playing: false });
                }
            } catch (e) {}
        }, 3000);
    };

    // İstatistikleri hesapla
    const activeUsers = Object.values(users).filter(u => Date.now() - u.last_seen < 300000);
    const listeningCount = activeUsers.filter(u => u.playing).length;

    return (
        <div className="min-h-screen bg-[#080808] text-white p-6 font-sans">
            <header className="flex justify-between items-center mb-4 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black italic text-green-500 tracking-tighter uppercase leading-none">SpotifyOnline</h1>
                {!token ? (
                    <a href="/login" className="bg-green-500 text-black px-8 py-3 rounded-full font-bold uppercase text-sm hover:scale-105 transition">Connect Wıth Spotıfy</a>
                ) : <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Logged</span>}
            </header>

            {/* Madde 3: İstatistik Barı */}
            {token && (
                <div className="flex space-x-4 mb-8 text-[10px] font-bold uppercase tracking-widest opacity-60">
                    <div>{activeUsers.length} ONLİNE</div>
                    <div className="text-gray-700">|</div>
                    <div className="text-green-500">{listeningCount} LİSTENİNG</div>
                </div>
            )}

            <h3 className="text-xs font-bold mb-8 opacity-40 uppercase tracking-[0.4em] italic">LİSTENERS</h3>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {activeUsers.map((u, index) => {
                    const prog = u.playing ? (u.progress_ms / u.duration_ms * 100) : 0;
                    
                    // Madde 1: Aynı şarkıyı dinleyenleri bulma (Match Glow)
                    const isMatch = u.playing && activeUsers.some(other => other.name !== u.name && other.playing && other.song_name === u.song_name);

                    return (
                        <div key={index} 
                             className={`bg-[#121212] p-6 rounded-[28px] flex items-center justify-between border shadow-2xl transition-all cursor-pointer ${isMatch ? 'border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/5'}`}
                             onClick={() => u.playing && window.open(`https://open.spotify.com/track/$${u.track_id}`, '_blank')}>
                            
                            <div className="flex flex-col flex-1 pr-6 overflow-hidden space-y-5">
                                <div className="flex items-center space-x-3">
                                    <img src={u.img} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="" />
                                    <h3 className="font-black text-xl italic uppercase tracking-tighter truncate">{u.name}</h3>
                                </div>

                                {u.playing ? (
                                    <div className="space-y-4">
                                        {/* Sanatçı - Şarkı aynı satır, aynı font */}
                                        <div className="overflow-hidden truncate">
                                            <span className="text-green-500 text-lg font-black uppercase whitespace-nowrap">
                                                {u.artist_name} - {u.song_name}
                                            </span>
                                        </div>
                                        
                                        <div className="w-full space-y-2">
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${prog}%` }} />
                                            </div>
                                            <div className="text-[12px] text-white font-mono font-bold tracking-widest">
                                                {formatTime(u.progress_ms)} <span className="text-gray-600 px-1">/</span> {formatTime(u.duration_ms)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">Inactive</p>
                                )}
                            </div>

                            {/* Madde 2: Sağ Bölüm (Spotify'da Dinle İkonu ile) */}
                            <div className="flex-shrink-0 relative group">
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-cover bg-center shadow-xl border border-white/5" 
                                     style={{ backgroundImage: `url(${u.playing ? u.album_img : u.img})` }}>
                                    {u.playing && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default App;
