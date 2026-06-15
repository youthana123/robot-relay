// relay-server.js — Node.js WebSocket Relay (Dual Board Version)
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dual Robot Relay Server OK\n');
});

const wss = new WebSocket.Server({ server });

// ⚠️ ขยายที่นั่งให้รองรับ 3 ส่วน
let camClient    = null; // สำหรับ ESP32 ตัวกล้อง
let audioClient  = null; // สำหรับ ESP32 ตัวเสียง/มอเตอร์
let webappClient = null; // สำหรับหน้าเว็บ/มือถือ

function isAlive(ws) {
    return ws && ws.readyState === WebSocket.OPEN;
}

wss.on('connection', (ws, req) => {
    const url  = new URL(req.url, 'http://localhost');
    const type = url.searchParams.get('type') || 'webapp';
    const ip   = req.socket.remoteAddress;

    console.log(`[+] ${type.toUpperCase()} connected from ${ip}`);

    // แยกที่นั่งให้ชัดเจน ใครมานั่งตรงไหน
    if (type === 'robot_cam') {
        if (isAlive(camClient)) camClient.terminate();
        camClient = ws;
    } else if (type === 'robot_audio') {
        if (isAlive(audioClient)) audioClient.terminate();
        audioClient = ws;
        if (isAlive(webappClient)) webappClient.send('ROBOT_PING');
    } else {
        if (isAlive(webappClient)) webappClient.terminate();
        webappClient = ws;
    }

    ws.on('message', (data, isBinary) => {
        if (type === 'robot_cam') {
            // ภาพจากกล้อง -> ส่งตรงให้เว็บ
            if (isAlive(webappClient) && isBinary) {
                webappClient.send(data, { binary: true });
            }
        } 
        else if (type === 'robot_audio') {
            // ข้อมูลจากตัวเสียง -> ส่งให้เว็บ
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
            // ข้อมูลจากเว็บ -> ส่งให้หุ่นยนต์ตัวเสียง/มอเตอร์
            if (!isAlive(audioClient)) return;
            if (isBinary) {
                audioClient.send(data, { binary: true });
            } else {
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

    // ระบบตรวจจับการหลุด (Heartbeat)
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
