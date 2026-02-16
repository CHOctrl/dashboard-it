import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server } from 'socket.io';
import { PC, Status, Branch } from './src/types/pc';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const BRANCHES: Branch[] = ['HQ', 'Sales', 'Engineering', 'HR', 'Warehouse'];

const generateSerial = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 8; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
};

const generateMockData = (count: number = 200): PC[] => {
  const data: PC[] = [];
  for (let i = 0; i < count; i++) {
    let status: Status = 'Imaging';
    const r = Math.random();
    if (r > 0.8) status = 'Completed';
    else if (r > 0.6) status = 'Shipped';

    data.push({
      id: `pc-${i}`,
      serial: generateSerial(),
      branch: BRANCHES[Math.floor(Math.random() * BRANCHES.length)],
      status: status,
    });
  }
  return data;
};

// In-memory state
let pcs: PC[] = generateMockData();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    // Send initial state
    socket.emit('initialState', pcs);

    socket.on('move', ({ id, newStatus }: { id: string, newStatus: Status }) => {
      pcs = pcs.map(pc => pc.id === id ? { ...pc, status: newStatus } : pc);
      // Broadcast update to all clients (including sender)
      io.emit('update', pcs);
    });

    socket.on('batchMove', ({ count, fromStatus, toStatus }: { count: number, fromStatus: Status, toStatus: Status }) => {
      // Find candidates with matching status
      const candidates = pcs.filter(p => p.status === fromStatus);
      if (candidates.length === 0) return;

      // Shuffle candidates (Fisher-Yates shuffle implementation for uniformity)
      const shuffled = [...candidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Select 'count' items
      const toMoveIds = new Set(shuffled.slice(0, Math.min(count, shuffled.length)).map(p => p.id));

      pcs = pcs.map(pc => toMoveIds.has(pc.id) ? { ...pc, status: toStatus } : pc);

      io.emit('update', pcs);
    });

    socket.on('reset', () => {
      pcs = generateMockData();
      io.emit('update', pcs);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
