const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// --- AYARLAR ---
const client_id = '69c0b423ad674d8a875396a42c0cc97e';
const client_secret = '1f55450ee0d24cbf93e137de52f6bfb8';
const redirect_uri = 'http://127.0.0.1:8888/callback';

// Middleware
app.use(express.static(path.join(__dirname, 'public')))
    .use(cors())
    .use(cookieParser());

// Giriş Yönlendirmesi
app.get('/login', (req, res) => {
    const scope = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri
        }));
});

// Spotify'dan Geri Dönüş (Callback)
app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const access_token = body.access_token;
            // Token ile ana sayfaya yönlendir
            res.redirect('/#access_token=' + access_token);
        } else {
            res.redirect('/#error=invalid_token');
        }
    });
});

const PORT = 8888;
app.listen(PORT, () => {
    console.log(`🚀 Sunucu hazır!`);
    console.log(`👉 Tarayıcıdan aç: http://127.0.0.1:${PORT}`);
});