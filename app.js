import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// Firebase Konfigürasyonu
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

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const _token = new URLSearchParams(hash.substring(1)).get('access_token');
            setToken(_token);
            startPresenceSystem(_token);
        }
    }, []);

    const startPresenceSystem = (t) => {
        // 1. Firebase Verilerini Dinle
        db.ref('presence').on('value', (snapshot) => {
            setUsers(snapshot.val() || {});
        });

        // 2. Kendi Durumunu Güncelle (Loop)
        const updateStatus = async () => {
            try {
                // Önce Profil
                const uRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${t}` } });
                const userData = await uRes.json();

                // Sonra Çalan Şarkı
                const sRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${t}` } });
                
                let updatePayload = {
                    name: userData.display_name,
                    img: userData.images[0]?.url || "",
                    last_seen: Date.now(),
                    online: true
                };

                if (sRes.status === 200) {
                    const songData = await sRes.json();
                    updatePayload = {
                        ...updatePayload,
                        playing: songData.is_playing,
                        song_name: songData.item.name,
                        artist_name: songData.item.artists.map(a => a.name).join(', '),
                        album_img: songData.item.album.images[0]?.url,
                        duration_ms: songData.item.duration_ms,
                        progress_ms: songData.progress_ms
                    };
                } else {
                    updatePayload.playing = false;
                }

                db.ref('presence/' + userData.id).update(updatePayload);
            } catch (e) { console.error("Sync Error:", e); }
        };

        updateStatus();
        setInterval(updateStatus, 3000);
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black italic text-green-500 tracking-tighter">SpotifyOnline</h1>
                {!token && (
                    <a href="https://spotifymatchproject.onrender.com/login" 
                       className="bg-green-500 text-black px-8 py-3 rounded-full font-bold uppercase text-sm hover:scale-105 transition">
                        Login with Spotify
                    </a>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(users).map(uid => {
                    const user = users[uid];
                    if (Date.now() - user.last_seen > 300000) return null;

                    const progress = user.playing ? (user.progress_ms / user.duration_ms * 100) : 0;

                    return (
                        <div key={uid} className="bg-white/5 p-6 rounded-[32px] flex items-center space-x-5 border border-white/10 shadow-xl">
                            <div className="w-20 h-20 rounded-2xl bg-gray-800 bg-cover bg-center flex-shrink-0 relative shadow-lg" 
                                 style={{ backgroundImage: `url(${user.playing ? user.album_img : user.img})` }}>
                                {user.playing && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#080808] animate-pulse" />}
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-xl truncate">{user.name}</h3>
                                {user.playing ? (
                                    <div className="mt-1">
                                        <p className="text-green-400 text-xs font-bold truncate uppercase">{user.song_name}</p>
                                        <p className="text-gray-400 text-[10px] italic truncate">{user.artist_name}</p>
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-xs mt-1 italic">Inactive</p>
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
