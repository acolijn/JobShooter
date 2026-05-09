import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT || 3001);
const DATA_FILE = process.env.DATA_FILE || './data/scores.json';
const HARD_LIMIT = 50;

async function readAll() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeAll(list) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(list, null, 2));
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
}

function sanitize(s) {
  return {
    name: String(s.name || 'anon').replace(/[^\w \-.]/g, '').slice(0, 24) || 'anon',
    score: Math.max(0, Math.floor(Number(s.score) || 0)),
    wave: Math.max(0, Math.floor(Number(s.wave) || 0)),
    coins: Math.max(0, Math.floor(Number(s.coins) || 0)),
    date: Date.now(),
  };
}

createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/scores' && req.method === 'GET') {
    const requested = parseInt(url.searchParams.get('limit') || '10', 10) || 10;
    const limit = Math.min(Math.max(1, requested), HARD_LIMIT);
    const all = (await readAll()).sort((a, b) => b.score - a.score).slice(0, limit);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(all));
  }

  if (url.pathname === '/scores' && req.method === 'POST') {
    let body = '';
    req.setEncoding('utf8');
    for await (const chunk of req) body += chunk;
    if (body.length > 4096) {
      res.writeHead(413);
      return res.end('body too large');
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400);
      return res.end('bad json');
    }
    const entry = sanitize(parsed);
    const all = await readAll();
    all.push(entry);
    all.sort((a, b) => b.score - a.score);
    const top = all.slice(0, HARD_LIMIT);
    await writeAll(top);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(top.slice(0, 10)));
  }

  res.writeHead(404);
  res.end('not found');
}).listen(PORT, () => console.log(`scores api listening on :${PORT}`));
