const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Robot Relay Server OK\n');
});

const wss = new WebSocket.Server({ server });

let robotClient  = null;
let webappClient = null;

function isAlive(ws) {
    return ws && ws.readyState === WebSocket.OPEN;
}

wss.on('connection', (ws, req) => {
    const url    = new URL(req.url, 'http://localhost');
    const type   = url.searchParams.get('type') || 'webapp';
    const ip     = req.socket.remoteAddress;

    console.log(`[+] ${type.toUpperCase()} connected from ${ip}`);

    if (type === 'robot') {
        if (isAlive(robotClient)) robotClient.terminate();
        robotClient = ws;
        if (isAlive(webappClient)) webappClient.send('ROBOT_PING');
    } else {
        if (isAlive(webappClient)) webappClient.terminate();
        webappClient = ws;
    }

    ws.on('message', (data, isBinary) => {
        if (type === 'robot') {
            if (!isAlive(webappClient)) return;
            webappClient.send(data, { binary: isBinary });
        } else {
            if (!isAlive(robotClient)) return;
            robotClient.send(data, { binary: isBinary });
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
    console.log(`Relay server running on port ${PORT}`);
});
