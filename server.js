// relay-server.js — Node.js WebSocket Relay
// Deploy ได้บน Render.com (free tier) หรือ Railway, Fly.io
// รัน: node server.js
// PORT จาก env หรือ 3000

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Robot Relay Server OK\n');
});

const wss = new WebSocket.Server({ server });

// เก็บ client แบ่งตามประเภท
let robotClient  = null; // ESP32
let webappClient = null; // Browser

function isAlive(ws) {
    return ws && ws.readyState === WebSocket.OPEN;
}

wss.on('connection', (ws, req) => {
    // ดู query string เพื่อแยกประเภท: ?type=robot หรือ ?type=webapp
    const url    = new URL(req.url, 'http://localhost');
    const type   = url.searchParams.get('type') || 'webapp';
    const ip     = req.socket.remoteAddress;

    console.log(`[+] ${type.toUpperCase()} connected from ${ip}`);

    if (type === 'robot') {
        // ถ้ามี robot เก่าอยู่ → ตัดทิ้ง
        if (isAlive(robotClient)) robotClient.terminate();
        robotClient = ws;
        // แจ้ง webapp ว่า robot online
        if (isAlive(webappClient)) webappClient.send('ROBOT_PING');
    } else {
        if (isAlive(webappClient)) webappClient.terminate();
        webappClient = ws;
    }

    ws.on('message', (data, isBinary) => {
        if (type === 'robot') {
            // Robot → WebApp
            if (!isAlive(webappClient)) return;
            if (isBinary) {
                // JPEG frame หรือ PCM audio จากหุ่น → ส่งต่อ webapp
                webappClient.send(data, { binary: true });
            } else {
                // Text: ROBOT_PING หรือ command
                const text = data.toString();
                if (text === 'ROBOT_PING') {
                    webappClient.send('ROBOT_PING');
                } else {
                    webappClient.send(text);
                }
            }
        } else {
            // WebApp → Robot
            if (!isAlive(robotClient)) return;
            if (isBinary) {
                // PCM audio จาก webapp → ส่งต่อ robot
                robotClient.send(data, { binary: true });
            } else {
                // Motor command (F, B, L, R, S)
                robotClient.send(data.toString());
            }
        }
    });

    ws.on('close', () => {
        console.log(`[-] ${type.toUpperCase()} disconnected`);
        if (type === 'robot') {
            robotClient = null;
            if (isAlive(webappClient)) webappClient.send('ROBOT_OFFLINE');
        } else {
            webappClient = null;
        }
    });

    ws.on('error', (err) => {
        console.error(`[!] ${type} error:`, err.message);
    });

    // Keepalive ping ทุก 20 วินาที
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
});

// ตรวจ heartbeat ทุก 25 วินาที
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) { ws.terminate(); return; }
        ws.isAlive = false;
        ws.ping();
    });
}, 25000);

server.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});
