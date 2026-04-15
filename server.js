const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');
const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing user-read-playback-state playlist-read-private';
const app = express();

const client_id = '69c0b423ad674d8a875396a42c0cc97e';
const client_secret = '1f55450ee0d24cbf93e137de52f6bfb8';
const redirect_uri = 'https://spotifymatchproject.onrender.com/callback';

app.use(express.static(__dirname)).use(cors()).use(cookieParser());

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.get('/login', (req, res) => {
    // 403 Hatasını Çözen İzinler (Scopes)
    const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing user-read-playback-state playlist-read-private';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri
        }));
});

app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: { code: code, redirect_uri: redirect_uri, grant_type: 'authorization_code' },
        headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
        json: true
    };

    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            res.redirect('/#access_token=' + body.access_token);
        } else {
            res.redirect('/#error=invalid_token');
        }
    });
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda aktif.`));
