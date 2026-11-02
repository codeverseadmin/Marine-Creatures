import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\tmp\\chrome-qa-profile';
const PORT = 9222;

// Clean up profile dir if exists
try {
  fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
} catch {}

const chromeProc = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${USER_DATA_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getBrowserWs() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch {}
    await wait(300);
  }
  throw new Error('Chrome did not respond on debug port');
}

async function main() {
  console.log('Waiting for Chrome CDP...');
  const wsUrl = await getBrowserWs();
  console.log('Connected to Chrome WebSocket:', wsUrl);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      const payload = { id: reqId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  // Create target for http://localhost:3000/api/health
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  }, sessionId);

  await send('Page.navigate', { url: 'http://localhost:3000/api/health' }, sessionId);
  await wait(1000);

  const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.mkdirSync('./qa-screenshots', { recursive: true });
  fs.writeFileSync('./qa-screenshots/test-health.png', Buffer.from(data, 'base64'));
  console.log('✓ Successfully captured test screenshot! Saved to ./qa-screenshots/test-health.png');

  ws.close();
  chromeProc.kill();
}

main().catch((err) => {
  console.error('Error:', err);
  chromeProc.kill();
  process.exit(1);
});

