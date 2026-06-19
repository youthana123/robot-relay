// relay-server.js — Node.js WebSocket Relay (Dual Board Version)
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dual Robot Relay Server OK\n');
});

const wss = new WebSocket.Server({ server });

let camClient    = null; 
let audioClient  = null; 
let webappClient = null; 

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
        if (isAlive(webappClient)) webappClient.send('ROBOT_PING');
    } else {
        if (isAlive(webappClient)) webappClient.terminate();
        webappClient = ws;
    }

    ws.on('message', (data, isBinary) => {
        // ⚠️ หัวใจสำคัญ: ตรวจสอบ Binary แบบครอบจักรวาล ป้องกันข้อมูลพัง
        const isBin = (isBinary !== undefined) ? isBinary : Buffer.isBuffer(data);

        if (type === 'robot_cam') {
            if (isAlive(webappClient)) webappClient.send(data, { binary: isBin });
        } 
        else if (type === 'robot_audio') {
            if (!isAlive(webappClient)) return;
            if (!isBin && data.toString() === 'ROBOT_PING') {
                webappClient.send('ROBOT_PING');
            } else {
                webappClient.send(data, { binary: isBin });
            }
        } 
        else {
            // ข้อมูลจากเว็บ -> ส่งให้หุ่นยนต์ตัวเสียง/มอเตอร์
            if (!isAlive(audioClient)) return;
            
            // ⚠️ ส่งข้อมูลไปแบบตรงไปตรงมา ไม่บังคับแปลงเป็น String แล้ว
            audioClient.send(data, { binary: isBin });
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
