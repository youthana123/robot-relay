// relay-server.js — Node.js WebSocket Relay
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dual Robot Relay Server OK\n');
});

const wss = new WebSocket.Server({ server });

// เก็บ client 3 ประเภท
let camClient    = null; // ESP32 ตัวส่งภาพ
let audioClient  = null; // ESP32 ตัวเสียง+มอเตอร์
let webappClient = null; // Browser

function isAlive(ws) {
    return ws && ws.readyState === WebSocket.OPEN;
}

wss.on('connection', (ws, req) => {
    const url  = new URL(req.url, 'http://localhost');
    const type = url.searchParams.get('type') || 'webapp';
    const ip   = req.socket.remoteAddress;

    console.log(`[+] ${type.toUpperCase()} connected from ${ip}`);

    if (type === 'robot_cam') {
        if (isAlive(camClient)) camClient.terminate();
        camClient = ws;
    } else if (type === 'robot_audio') {
        if (isAlive(audioClient)) audioClient.terminate();
        audioClient = ws;
        if (isAlive(webappClient)) webappClient.send('ROBOT_PING'); // แจ้งเว็บว่าหุ่นออนไลน์
    } else {
        if (isAlive(webappClient)) webappClient.terminate();
        webappClient = ws;
    }

    ws.on('message', (data, isBinary) => {
        if (type === 'robot_cam') {
            // ภาพจากกล้อง -> ส่งให้เว็บ
            if (isAlive(webappClient) && isBinary) {
                webappClient.send(data, { binary: true });
            }
        } 
        else if (type === 'robot_audio') {
            // เสียงจากไมค์หุ่น -> ส่งให้เว็บ
            if (!isAlive(webappClient)) return;
            if (isBinary) {
                webappClient.send(data, { binary: true });
            } else {
                const text = data.toString();
                if (text === 'ROBOT_PING') webappClient.send('ROBOT_PING');
                else webappClient.send(text);
            }
        } 
        else {
            // คำสั่งจากเว็บ -> ส่งให้หุ่น
            if (!isAlive(audioClient)) return;
            if (isBinary) {
                // เสียงพูดจากเว็บ -> ส่งเข้าลำโพง (ESP Audio)
                audioClient.send(data, { binary: true });
            } else {
                // คำสั่งมอเตอร์ -> ส่งเข้า ESP Audio
                audioClient.send(data.toString());
            }
        }
    });

    ws.on('close', () => {
        console.log(`[-] ${type.toUpperCase()} disconnected`);
        if (type === 'robot_cam') camClient = null;
        else if (type === 'robot_audio') {
            audioClient = null;
            if (isAlive(webappClient)) webappClient.send('ROBOT_OFFLINE');
        } 
        else webappClient = null;
    });

    ws.on('error', (err) => console.error(`[!] ${type} error:`, err.message));

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
});

setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) { ws.terminate(); return; }
        ws.isAlive = false;
        ws.ping();
    });
}, 25000);

server.listen(PORT, () => {
    console.log(`Dual Relay server running on port ${PORT}`);
});
