const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`Relay Server running on port ${PORT}`);
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data, isBinary) {
    // โยนข้อมูลทุกอย่าง (ภาพ, เสียง, คำสั่งมอเตอร์) ให้ทุกคนในห้อง (ยกเว้นตัวเอง)
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});