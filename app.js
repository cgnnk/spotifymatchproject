import React, { useState, useEffect } from 'react';
// Firebase'i buraya ekliyoruz
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// Firebase Konfigürasyonun (Avrupa Sunucusu)
const firebaseConfig = {
  apiKey: "AIzaSyDeGgTl_FUeP7Hg5y5uEb3rPYGXU1SIcdA",
  authDomain: "spotifymatchproject.firebaseapp.com",
  databaseURL: "https://spotifymatchproject-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spotifymatchproject",
  storageBucket: "spotifymatchproject.firebasestorage.app",
  messagingSenderId: "525504631473",
  appId: "1:525504631473:web:6c6e2d56e531f966a58890"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const App = () => {
    const [token, setToken] = useState('');
    const [tracks, setTracks] = useState([]);
    const [users, setUsers] = useState({});

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const _token = hash.split('&')[0].split('=')[1];
            setToken(_token);
            fetchData(_token);
        }
    }, []);

    const fetchData = async (t) => {
        // 1. Profil Bilgilerini Al ve Firebase'e Yaz
        const userRes = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${t}` }
        });
        const userData = await userRes.json();
        
        if (userData.id) {
            db.ref('presence/' + userData.id).update({
                name: userData.display_name,
                img: userData.images[0]?.url || "",
                last_seen: Date.now(),
                online: true
            });
        }

        // 2. Favori Şarkıları Al
        const trackRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
            headers: { Authorization: `Bearer ${t}` }
        });
        const trackData = await trackRes.json();
        setTracks(trackData.items || []);

        // 3. Firebase'den Diğer Kullanıcıları Dinle
        db.ref('presence').on('value', (snapshot) => {
            setUsers(snapshot.val() || {});
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans">
            <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-5">
                <h1 className="text-3xl font-black italic text-green-500">Spotify</h1>
                {!token ? (
                    // BURASI ÖNEMLİ: localhost yerine Render linkini koymalısın
                    <a href="https://spotifymatchproject.onrender.com/login" className="bg-green-500 px-6 py-2 rounded-full font-bold text-black">Spotify ile Bağlan</a>
                ) : (
                    <span className="text-green-400 font-bold uppercase tracking-widest text-xs">Oturum Açıldı</span>
                )}
            </header>

            {/* Aktif Dinleyiciler Bölümü */}
            <div className="mb-10">
                <h3 className="text-gray-500 uppercase text-xs font-bold mb-4 tracking-widest">Aktif Dinleyiciler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(users).map(uid => (
                        <div key={uid} className="bg-gray-900/50 p-4 rounded-2xl flex items-center space-x-4 border border-gray-800">
                            <img src={users[uid].img} className="w-12 h-12 rounded-full border border-gray-700" alt="" />
                            <div>
                                <h4 className="font-bold">{users[uid].name}</h4>
                                <p className="text-xs text-gray-500 italic">{users[uid].status || 'Çevrimiçi'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Şarkılar */}
            <h3 className="text-gray-500 uppercase text-xs font-bold mb-4 tracking-widest">Senin Favorilerin</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {tracks.map((track) => (
                    <div key={track.id} className="bg-gray-900/50 p-3 rounded-2xl hover:bg-gray-800 transition group cursor-pointer">
                        <img src={track.album.images[0].url} alt={track.name} className="rounded-xl mb-3" />
                        <h3 className="font-bold text-sm truncate">{track.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{track.artists[0].name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
