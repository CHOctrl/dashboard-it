import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server } from 'socket.io';
import fs from 'node:fs';
import path from 'node:path';
import { PC, Status, Branch } from './src/types/pc';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const DATA_FILE = path.join(process.cwd(), 'data', 'pcs.json');
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

// Persistence helpers
const loadData = (): PC[] => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to load data:', err);
  }
  return generateMockData();
};

const saveData = (data: PC[]) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
};

// In-memory state initialized from file or mock
let pcs: PC[] = loadData();

// Save initial state if file didn't exist
if (!fs.existsSync(DATA_FILE)) {
  saveData(pcs);
}

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

    socket.on('move', ({ id, newStatus, newBranch }: { id: string, newStatus: Status, newBranch?: Branch }) => {
      pcs = pcs.map(pc => pc.id === id ? {
        ...pc,
        status: newStatus,
        branch: newBranch || pc.branch
      } : pc);
      saveData(pcs);
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
      saveData(pcs);

      io.emit('update', pcs);
    });

    socket.on('reset', () => {
      pcs = generateMockData();
      saveData(pcs);
      io.emit('update', pcs);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
