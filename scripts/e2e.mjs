import { spawn } from 'node:child_process';
import http from 'node:http';

const url = 'http://127.0.0.1:3000';

const isReady = () => new Promise(resolve => {
  const req = http.get(url, res => {
    res.resume();
    resolve(res.statusCode === 200);
  });
  req.on('error', () => resolve(false));
  req.setTimeout(1000, () => {
    req.destroy();
    resolve(false);
  });
});

const waitForReady = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isReady()) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Vite did not start at ${url}`);
};

let server;
if (!(await isReady())) {
  // ponytail: prestart Vite because Playwright webServer cleanup hangs in this Windows shell; remove when direct `playwright test` exits cleanly.
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port=3000', '--host=0.0.0.0'], {
    stdio: 'inherit',
    shell: false
  });
  await waitForReady();
}

const runner = spawn(process.execPath, ['node_modules/playwright/cli.js', 'test'], {
  stdio: 'inherit',
  shell: false
});

const code = await new Promise(resolve => runner.on('exit', resolve));
server?.kill();
process.exit(code ?? 1);
