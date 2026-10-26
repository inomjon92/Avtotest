// Lokal ishlab chiqish uchun /api funksiyalarini oddiy HTTP serverda ishga tushiradi (Vercel o'rniga).
// Foydalanish: DATABASE_URL=postgres://... npm run dev:api   (vite dev /api ni shu serverga yo'naltiradi)
import { createServer, type IncomingMessage } from 'node:http';
import type { Req, Res } from '../api/_lib.js';

const routes: Record<string, () => Promise<{ default: (req: Req, res: Res) => Promise<void> }>> = {
  auth: () => import('../api/auth.js'),
  progress: () => import('../api/progress.js'),
  content: () => import('../api/content.js'),
  admin: () => import('../api/admin.js'),
  community: () => import('../api/community.js'),
};

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString();
  try { return raw ? JSON.parse(raw) : undefined; } catch { return raw; }
}

export function startApiServer(port: number) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    const load = routes[name];
    if (!load) { res.statusCode = 404; return res.end('{"error":"not found"}'); }
    const mod = await load();
    let code = 200;
    const r: Res = {
      status(c) { code = c; return r; },
      json(b) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(b)); },
      setHeader(k, v) { res.setHeader(k, v); },
      end() { res.statusCode = code; res.end(); },
    };
    await mod.default({ method: req.method, headers: req.headers, body: await readBody(req), query: Object.fromEntries(url.searchParams) }, r);
  });
  return new Promise<typeof server>((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1]?.endsWith('dev-api.ts')) {
  const port = Number(process.env.API_PORT ?? 3001);
  startApiServer(port).then(() => console.log(`API: http://localhost:${port}/api`));
}
