<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>น้องหุ่นยนต์ 🤖</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f0f4ff; --card: #ffffff; --text: #3a3a5c;
            --blue: #5b8dee; --blue-s: #3a6dcc;
            --red: #ff6b81;  --red-s: #cc4a5e;
            --green: #2ed573; --orange: #ffa502;
            --purple: #a29bfe; --gray: #dfe6e9;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: var(--bg); color: var(--text);
            font-family: 'Kanit', sans-serif;
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center;
            padding: 16px;
        }
        .container { width: 100%; max-width: 560px; }
        h2 { text-align: center; font-size: 22px; font-weight: 600; color: var(--blue); margin-bottom: 14px; }

        .status-bar { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 14px; }
        .badge {
            background: var(--card); border-radius: 20px; padding: 6px 14px;
            font-size: 13px; display: flex; align-items: center; gap: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--gray); transition: background 0.3s; }
        .dot.online  { background: var(--green); box-shadow: 0 0 6px var(--green); }
        .dot.offline { background: #ff4757; }

        .video-wrapper {
            position: relative; width: 100%; border-radius: 16px; overflow: hidden;
            background: #1a1a2e; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            margin-bottom: 18px; aspect-ratio: 4/3;
            display: flex; align-items: center; justify-content: center;
        }
        #video-stream { width: 100%; height: 100%; object-fit: cover; display: block; transform: rotate(180deg); }
        #no-signal { position: absolute; color: #666; font-size: 14px; text-align: center; }
        .hud-overlay {
            position: absolute; top: 10px; right: 10px;
            background: rgba(255,50,50,0.9); color: #fff;
            padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;
            display: none; animation: blink 1s infinite;
        }
        @keyframes blink { 50% { opacity: 0.5; } }

        .d-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 260px; margin: 0 auto 18px auto; }
        .btn-ctrl {
            background: var(--blue); color: #fff; border: none;
            padding: 18px 0; border-radius: 14px; font-size: 20px;
            cursor: pointer; box-shadow: 0 5px 0 var(--blue-s);
            transition: transform 0.08s, box-shadow 0.08s;
            font-family: inherit; user-select: none; -webkit-user-select: none;
        }
        .btn-ctrl.pressed { transform: translateY(4px); box-shadow: 0 1px 0 var(--blue-s); }
        .btn-stop { background: var(--red); box-shadow: 0 5px 0 var(--red-s); font-size: 14px; font-weight: bold; }
        .btn-stop.pressed { box-shadow: 0 1px 0 var(--red-s); }
        .up { grid-column:2; grid-row:1; } .left { grid-column:1; grid-row:2; }
        .stop { grid-column:2; grid-row:2; } .right { grid-column:3; grid-row:2; } .down { grid-column:2; grid-row:3; }

        .action-panel { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-action {
            flex: 1; min-width: 140px; max-width: 200px; padding: 14px 10px;
            border-radius: 14px; border: none; font-size: 15px; font-weight: 600;
            cursor: pointer; font-family: inherit;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: transform 0.1s;
        }
        .btn-mic { background: var(--orange); color: #fff; box-shadow: 0 4px 0 #c47a00; }
        .btn-mic.active { background: #ff4757; box-shadow: 0 4px 0 #cc2333; animation: mpulse 0.8s infinite; }
        @keyframes mpulse { 0%,100% { box-shadow: 0 4px 0 #cc2333; } 50% { box-shadow: 0 4px 16px rgba(255,71,87,0.6); } }
        .btn-record { background: var(--purple); color: #fff; box-shadow: 0 4px 0 #7c6fd4; }
        .btn-record.active { background: #ff4757; box-shadow: 0 4px 0 #cc2333; }
        canvas { display: none; }
        #meter-wrap { display: none; width: 100%; max-width: 260px; margin: 10px auto 0; height: 6px; background: var(--gray); border-radius: 3px; overflow: hidden; }
        #meter-bar  { height: 100%; width: 0%; background: linear-gradient(90deg, var(--green), var(--orange), var(--red)); border-radius: 3px; transition: width 0.05s; }
    </style>
</head>
<body>
<div class="container">
    <h2>น้องหุ่นยนต์ 🤖✨</h2>
    <div class="status-bar">
        <div class="badge"><div id="cloud-dot" class="dot offline"></div>Cloud</div>
        <div class="badge"><div id="robot-dot" class="dot offline"></div>Robot</div>
        <div class="badge">🔊 <span id="audio-status">พร้อมใช้งาน</span></div>
    </div>
    <div class="video-wrapper">
        <div id="no-signal">📷 รอสัญญาณภาพ...</div>
        <img id="video-stream" alt="" style="display:none;">
        <div id="rec-indicator" class="hud-overlay">🔴 REC</div>
    </div>
    <canvas id="record-canvas"></canvas>
    <div class="d-pad">
        <button class="btn-ctrl up"   data-cmd="F">▲</button>
        <button class="btn-ctrl left" data-cmd="L">◀</button>
        <button class="btn-ctrl btn-stop stop" data-cmd="S">หยุด</button>
        <button class="btn-ctrl right" data-cmd="R">▶</button>
        <button class="btn-ctrl down"  data-cmd="B">▼</button>
    </div>
    <div class="action-panel">
        <button id="mic-btn"    class="btn-action btn-mic">🎙️ กดค้างเพื่อพูด</button>
        <button id="record-btn" class="btn-action btn-record">📹 บันทึกวิดีโอ</button>
    </div>
    <div id="meter-wrap"><div id="meter-bar"></div></div>
</div>
<script>
// ============================================================
// CONFIG
// ============================================================
const WS_HOST    = 'robot-relay-67r7.onrender.com'; 
const SAMPLE_RATE = 16000;
const MIC_GAIN    = 8.0;
const SPK_GAIN    = 1.0;

const WS_URL = `wss://${WS_HOST}/?type=webapp`;

// ============================================================
// DOM
// ============================================================
const cloudDot    = document.getElementById('cloud-dot');
const robotDot    = document.getElementById('robot-dot');
const audioStatus = document.getElementById('audio-status');
const imgEl       = document.getElementById('video-stream');
const noSignal    = document.getElementById('no-signal');
const micBtn      = document.getElementById('mic-btn');
const recordBtn   = document.getElementById('record-btn');
const recIndicator= document.getElementById('rec-indicator');
const canvas      = document.getElementById('record-canvas');
const ctx2d       = canvas.getContext('2d');
const meterWrap   = document.getElementById('meter-wrap');
const meterBar    = document.getElementById('meter-bar');

// ============================================================
// WebSocket
// ============================================================
let ws, robotOnline = false, robotTimer;

function connectWS() {
    ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        cloudDot.className = 'dot online';
        console.log('[WS] WebApp connected');
    };
    ws.onclose = () => {
        cloudDot.className = 'dot offline';
        robotDot.className = 'dot offline';
        robotOnline = false;
        console.log('[WS] Disconnected — retry in 3s');
        setTimeout(connectWS, 3000);
    };
    ws.onerror = err => console.error('[WS]', err);

    ws.onmessage = event => {
        if (typeof event.data === 'string') {
            if (event.data === 'ROBOT_PING' || event.data === 'ROBOT_ONLINE') {
                robotDot.className = 'dot online';
                robotOnline = true;
                clearTimeout(robotTimer);
                robotTimer = setTimeout(() => {
                    robotDot.className = 'dot offline';
                    robotOnline = false;
                }, 5000);
            } else if (event.data === 'ROBOT_OFFLINE') {
                robotDot.className = 'dot offline';
                robotOnline = false;
            }
            return;
        }

        const ab = event.data;
        const dv = new DataView(ab);

        if (dv.byteLength >= 2 && dv.getUint8(0) === 0xFF && dv.getUint8(1) === 0xD8) {
            const blob = new Blob([ab], { type: 'image/jpeg' });
            const url  = URL.createObjectURL(blob);
            imgEl.onload = () => {
                noSignal.style.display = 'none';
                imgEl.style.display    = 'block';
                if (isRecording) drawFrameToCanvas();
                URL.revokeObjectURL(url);
            };
            imgEl.src = url;
        } else {
            playPCM(ab);
        }
    };
}
connectWS();

function safeSend(data) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
}

// ============================================================
// D-PAD
// ============================================================
document.querySelectorAll('.btn-ctrl').forEach(btn => {
    const cmd = btn.dataset.cmd;
    const onPress   = e => { e.preventDefault(); btn.classList.add('pressed'); safeSend(cmd); };
    const onRelease = e => { e.preventDefault(); btn.classList.remove('pressed'); if (cmd !== 'S') safeSend('S'); };
    btn.addEventListener('mousedown',   onPress);
    btn.addEventListener('mouseup',     onRelease);
    btn.addEventListener('mouseleave',  onRelease);
    btn.addEventListener('touchstart',  onPress,   { passive: false });
    btn.addEventListener('touchend',    onRelease, { passive: false });
    btn.addEventListener('touchcancel', onRelease, { passive: false });
});

// ============================================================
// SPEAKER 
// ============================================================
const spkCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
let   nextAt  = 0;

// ⚠️ ปลดล็อคระบบเสียงเมื่อผู้ใช้แตะหน้าจอ (เบราว์เซอร์จะไม่บล็อกเสียงอีกต่อไป)
document.body.addEventListener('pointerdown', () => {
    if (spkCtx.state === 'suspended') spkCtx.resume();
}, { once: true });

function playPCM(buffer) {
    if (spkCtx.state === 'suspended') return; // กัน Error ถ้ายังไม่ได้แตะหน้าจอ

    const i16 = new Int16Array(buffer);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) {
        f32[i] = Math.max(-1, Math.min(1, (i16[i] / 32768) * SPK_GAIN));
    }

    const audioBuf = spkCtx.createBuffer(1, f32.length, SAMPLE_RATE);
    audioBuf.getChannelData(0).set(f32);

    const src = spkCtx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(spkCtx.destination);

    const now = spkCtx.currentTime;
    if (nextAt < now) nextAt = now + 0.02; 
    src.start(nextAt);
    nextAt += audioBuf.duration;

    audioStatus.textContent = '🔈 หุ่นกำลังพูด...';
    clearTimeout(window._spkTimer);
    window._spkTimer = setTimeout(() => audioStatus.textContent = 'พร้อมใช้งาน', 600);
}

// ============================================================
// MICROPHONE 
// ============================================================
let micCtx = null, micStream = null, micNode = null, micActive = false;

async function startMic() {
    if (micActive) return;
    if (spkCtx.state === 'suspended') await spkCtx.resume();

    try {
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: SAMPLE_RATE,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false
            }
        });
    } catch(e) {
        alert('ไม่สามารถเข้าถึงไมค์: ' + e.message);
        return;
    }

    micActive = true;
    micBtn.classList.add('active');
    micBtn.textContent = '🔴 กำลังพูด...';
    meterWrap.style.display = 'block';

    micCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    const source = micCtx.createMediaStreamSource(micStream);

    if (micCtx.audioWorklet) {
        const workletSrc = `
class P extends AudioWorkletProcessor {
    constructor() { super(); this._b = new Int16Array(512); this._i = 0; }
    process(inputs) {
        const ch = inputs[0]?.[0]; if (!ch) return true;
        for (let i = 0; i < ch.length; i++) {
            let s = ch[i] * ${MIC_GAIN};
            s = s > 1 ? 1 : s < -1 ? -1 : s;
            this._b[this._i++] = s < 0 ? s * 32768 : s * 32767;
            if (this._i >= 512) {
                this.port.postMessage(this._b.buffer.slice(0));
                this._i = 0;
            }
        }
        return true;
    }
}
registerProcessor('p', P);`;
        const blobUrl = URL.createObjectURL(new Blob([workletSrc], { type: 'application/javascript' }));
        await micCtx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        micNode = new AudioWorkletNode(micCtx, 'p');
        micNode.port.onmessage = e => {
            safeSend(e.data);
            updateMeter(new Int16Array(e.data));
        };
        source.connect(micNode);

    } else {
        micNode = micCtx.createScriptProcessor(1024, 1, 1);
        const outBuf = new Int16Array(512); let idx = 0;
        micNode.onaudioprocess = e => {
            const f = e.inputBuffer.getChannelData(0);
            for (let i = 0; i < f.length; i++) {
                let s = f[i] * MIC_GAIN; s = s>1?1:s<-1?-1:s;
                outBuf[idx++] = s < 0 ? s * 32768 : s * 32767;
                if (idx >= 512) {
                    safeSend(outBuf.buffer.slice(0));
                    updateMeter(outBuf);
                    idx = 0;
                }
            }
        };
        source.connect(micNode);
        micNode.connect(micCtx.destination);
    }

    audioStatus.textContent = '🎙️ กำลังส่งเสียง...';
}

function stopMic() {
    if (!micActive) return;
    micActive = false;
    micBtn.classList.remove('active');
    micBtn.innerHTML = '🎙️ กดค้างเพื่อพูด';
    meterWrap.style.display = 'none';
    meterBar.style.width = '0%';
    audioStatus.textContent = 'พร้อมใช้งาน';

    try { micNode?.disconnect(); } catch(_){}
    micCtx?.close().catch(()=>{});
    micStream?.getTracks().forEach(t => t.stop());
    micNode = null; micCtx = null; micStream = null;
}

function updateMeter(i16) {
    let s = 0;
    for (let i = 0; i < i16.length; i++) s += Math.abs(i16[i]);
    meterBar.style.width = Math.min(100, (s / i16.length / 8000) * 100) + '%';
}

['mousedown','touchstart'].forEach(ev =>
    micBtn.addEventListener(ev, e => { e.preventDefault(); startMic(); }, { passive: false }));
['mouseup','mouseleave','touchend','touchcancel'].forEach(ev =>
    micBtn.addEventListener(ev, e => { e.preventDefault(); stopMic(); }, { passive: false }));

// ============================================================
// VIDEO RECORDER
// ============================================================
let mediaRecorder = null, recChunks = [], isRecording = false;

recordBtn.addEventListener('click', () => isRecording ? stopRec() : startRec());

function startRec() {
    recChunks = [];
    canvas.width  = imgEl.naturalWidth  || 320;
    canvas.height = imgEl.naturalHeight || 240;
    const stream = canvas.captureStream(15);
    const mime   = ['video/webm;codecs=vp9','video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recChunks, { type: 'video/webm' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `Robot_${Date.now()}.webm` });
        document.body.appendChild(a); a.click(); a.remove();
    };
    mediaRecorder.start(200);
    isRecording = true;
    recordBtn.classList.add('active'); recordBtn.textContent = '⏹️ หยุดบันทึก';
    recIndicator.style.display = 'block';
}

function stopRec() {
    mediaRecorder?.state !== 'inactive' && mediaRecorder.stop();
    isRecording = false;
    recordBtn.classList.remove('active'); recordBtn.textContent = '📹 บันทึกวิดีโอ';
    recIndicator.style.display = 'none';
}

function drawFrameToCanvas() {
    ctx2d.save();
    ctx2d.translate(canvas.width, canvas.height);
    ctx2d.rotate(Math.PI);
    ctx2d.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    ctx2d.restore();
}
</script>
</body>
</html>
