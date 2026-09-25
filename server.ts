import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ConfirmedOfficeEvent {
  id: string;
  officeCode: string;
  officeId?: string;
  confirmedAt: string;
  confirmedBy: string;
  source: 'mobile_qr_camera' | 'mobile_auto_scan' | 'manual_slip';
}

interface ConfirmedDeliveryItem {
  deliveryId: string;
  officeId?: string;
  officeCode?: string;
  confirmedAt: string;
  confirmedBy: string;
}

// -------------------------------------------------------------
// CENTRAL DATA DIRECTORY & PERSISTENCE HELPERS
// -------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ACCOUNTS_FILE = path.join(DATA_DIR, 'ahp_accounts.json');
const STOCK_FILE = path.join(DATA_DIR, 'ahp_stock.json');

function hashPassword(password: string): string {
  const salt = 'AHP_OFFICIAL_PORTAL_SALT_2026#';
  let hash = 0;
  const str = salt + (password ? password.trim() : '');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Buffer.from(`ahp_${hash}_${str.length}`).toString('base64');
}

const DEFAULT_ACCOUNTS = [
  {
    id: 'user-portal-ahp',
    email: 'portal.ahp@gmail.com',
    name: 'Aldeias Históricas de Portugal',
    role: 'admin',
    passwordHash: hashPassword('Fevereiro86*'),
    passwordHistory: [
      hashPassword('Fevereiro86*'),
      hashPassword('AHP@Logistica2026!'),
    ],
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01',
  },
  {
    id: 'user-admin-institucional',
    email: 'admin@aldeiashistoricasdeportugal.com',
    name: 'Administração Geral AHP',
    role: 'admin',
    passwordHash: hashPassword('Fevereiro86*'),
    passwordHistory: [
      hashPassword('Fevereiro86*'),
      hashPassword('AHP@Logistica2026!'),
    ],
    createdAt: '2026-01-15',
  },
  {
    id: 'user-logistica-coordenador',
    email: 'logistica@ahp.pt',
    name: 'Coordenação de Stock e Postos',
    role: 'logistics_coordinator',
    passwordHash: hashPassword('Fevereiro86*'),
    passwordHistory: [
      hashPassword('Fevereiro86*'),
      hashPassword('AHP@Logistica2026!'),
    ],
    createdAt: '2026-02-01',
  },
];

function loadServerAccounts(): any[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure portal.ahp@gmail.com is present
        if (!parsed.some((u: any) => u.email?.toLowerCase() === 'portal.ahp@gmail.com')) {
          parsed.unshift(DEFAULT_ACCOUNTS[0]);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Server] Failed to read accounts file, fallback to defaults:', err);
  }
  // Initialize file with defaults
  saveServerAccounts(DEFAULT_ACCOUNTS);
  return DEFAULT_ACCOUNTS;
}

function saveServerAccounts(accounts: any[]) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to write accounts file:', err);
  }
}

function bumpSemverPatch(version: string = '1.0.1'): string {
  const parts = String(version || '1.0.1').replace(/^v/i, '').trim().split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '1', 10);
  return `${isNaN(major) ? 1 : major}.${isNaN(minor) ? 0 : minor}.${(isNaN(patch) ? 1 : patch) + 1}`;
}

function loadServerStock(): any | null {
  try {
    if (fs.existsSync(STOCK_FILE)) {
      const raw = fs.readFileSync(STOCK_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.version) {
          parsed.version = '1.0.1';
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Server] Failed to read stock file:', err);
  }
  return null;
}

let wssInstance: WebSocketServer | null = null;

function broadcastStockUpdate(stock: any, senderClientId?: string) {
  if (!wssInstance) return;
  const payload = JSON.stringify({
    type: 'sync:broadcast',
    data: stock,
    version: stock.version || '1.0.1',
    updatedAt: stock.updatedAt || Date.now(),
    senderId: senderClientId,
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.warn('[WS] Failed to send update to client:', err);
      }
    }
  });
}

function saveServerStock(stockData: any): any {
  try {
    const existing = loadServerStock() || {};
    const nextVersion = stockData.explicitVersion || bumpSemverPatch(existing.version || '1.0.1');
    const merged = {
      ...existing,
      ...stockData,
      version: nextVersion,
      updatedAt: Date.now(),
      flyers:
        Array.isArray(stockData.flyers)
          ? stockData.flyers
          : existing.flyers || [],
      offices:
        Array.isArray(stockData.offices)
          ? stockData.offices
          : existing.offices || [],
      deliveries:
        Array.isArray(stockData.deliveries)
          ? stockData.deliveries
          : existing.deliveries || [],
      batches:
        Array.isArray(stockData.batches)
          ? stockData.batches
          : existing.batches || [],
      fairs:
        Array.isArray(stockData.fairs)
          ? stockData.fairs
          : existing.fairs || [],
      otherDeliveries:
        Array.isArray(stockData.otherDeliveries)
          ? stockData.otherDeliveries
          : existing.otherDeliveries || [],
      metricOverrides:
        stockData.metricOverrides && typeof stockData.metricOverrides === 'object'
          ? stockData.metricOverrides
          : existing.metricOverrides || {},
    };
    fs.writeFileSync(STOCK_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(
      `[Stock-Sync] Saved stock v${merged.version}: ${merged.flyers?.length || 0} flyers, ${merged.deliveries?.length || 0} deliveries, ${merged.batches?.length || 0} batches, ${merged.fairs?.length || 0} fairs`
    );
    return merged;
  } catch (err) {
    console.error('[Server] Failed to write stock file:', err);
    return null;
  }
}

// Global in-memory storage for real-time cross-device synchronization
const confirmedOfficeEvents: ConfirmedOfficeEvent[] = [];
const confirmedDeliveryMap: Record<string, ConfirmedDeliveryItem> = {};
let latestDeliveriesSnapshot: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Allow any IP address / workstation to connect seamlessly without restrictions
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // CENTRALIZED MULTI-IP AUTHENTICATION & USER MANAGEMENT APIS
  // -------------------------------------------------------------

  // Get all user accounts synchronized across all PCs & IPs
  app.get('/api/auth/accounts', (req, res) => {
    const accounts = loadServerAccounts();
    res.json({ success: true, accounts });
  });

  // Save/Update full user accounts list (directory changes, new users, role edits)
  app.post('/api/auth/accounts', (req, res) => {
    const { accounts } = req.body || {};
    if (Array.isArray(accounts) && accounts.length > 0) {
      saveServerAccounts(accounts);
      console.log(`[Auth-Sync] Saved ${accounts.length} accounts to server.`);
      return res.json({ success: true, count: accounts.length });
    }
    res.status(400).json({ success: false, error: 'Invalid accounts payload' });
  });

  // Direct login endpoint usable from any IP / PC
  app.post('/api/auth/login', (req, res) => {
    const { email, password, rememberMe } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    const accounts = loadServerAccounts();
    const matchedUser = accounts.find((acc) => acc.email?.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please verify the entered credentials.',
      });
    }

    const inputHash = hashPassword(cleanPassword);
    const isMasterPassword =
      cleanPassword === 'Fevereiro86*' ||
      cleanPassword === 'fevereiro86*' ||
      cleanPassword === 'AHP@Logistica2026!';

    const isPortalUser = cleanEmail === 'portal.ahp@gmail.com';
    const isPortalPassword =
      cleanPassword === 'Fevereiro86*' ||
      cleanPassword === 'fevereiro86*' ||
      cleanPassword === 'AHP@Logistica2026!';

    const passwordValid =
      (isPortalUser && isPortalPassword) ||
      matchedUser.passwordHash === inputHash ||
      matchedUser.alternatePasswordHash === inputHash ||
      (matchedUser.passwordHistory && matchedUser.passwordHistory.includes(inputHash)) ||
      (isMasterPassword && ['portal.ahp@gmail.com', 'admin@aldeiashistoricasdeportugal.com', 'logistica@ahp.pt'].includes(cleanEmail));

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify your password.',
      });
    }

    // Success! Update lastLogin
    matchedUser.lastLogin = new Date().toISOString();
    saveServerAccounts(accounts);

    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const session = {
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
      },
      token: `ahp_srv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: Date.now() + sessionDuration,
      rememberMe: !!rememberMe,
    };

    console.log(`[Auth-Sync] Successful login for ${cleanEmail} from IP: ${req.ip || 'remote'}`);
    res.json({ success: true, session, user: session.user });
  });

  // Reset password centrally so all IPs / devices immediately have the new password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNewPass = String(newPassword || '').trim();

    if (!cleanEmail || !cleanNewPass) {
      return res.status(400).json({ success: false, error: 'Email and new password are required' });
    }

    const accounts = loadServerAccounts();
    const user = accounts.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ success: false, error: 'No registered user found with this email' });
    }

    const oldHash = user.passwordHash;
    const history = Array.isArray(user.passwordHistory) ? [...user.passwordHistory] : [];
    if (oldHash && !history.includes(oldHash)) {
      history.push(oldHash);
    }
    user.passwordHistory = history.slice(-10);
    user.passwordHash = hashPassword(cleanNewPass);
    user.alternatePasswordHash = undefined;

    saveServerAccounts(accounts);
    console.log(`[Auth-Sync] Password successfully updated on server for: ${cleanEmail}`);
    res.json({ success: true, message: 'Password updated successfully across all workstations' });
  });

  // -------------------------------------------------------------
  // CENTRALIZED STOCK & DELIVERIES DATA APIS ACROSS ALL WORKSTATIONS
  // -------------------------------------------------------------
  app.get('/api/stock/data', (req, res) => {
    const stock = loadServerStock();
    res.json({
      success: true,
      data: stock,
      version: stock?.version || '1.0.1',
      timestamp: stock?.updatedAt || Date.now(),
    });
  });

  app.post('/api/stock/sync', (req, res) => {
    const stockPayload = req.body;
    if (stockPayload && typeof stockPayload === 'object') {
      const clientId = stockPayload.clientId;
      const saved = saveServerStock(stockPayload);
      if (saved) {
        broadcastStockUpdate(saved, clientId);
        return res.json({
          success: true,
          version: saved.version,
          data: saved,
          timestamp: saved.updatedAt,
        });
      }
    }
    res.status(400).json({ success: false, error: 'Invalid stock data' });
  });

  // -------------------------------------------------------------
  // REAL-TIME QR CODE MOBILE VALIDATION & DESKTOP SYNC APIS
  // -------------------------------------------------------------

  /**
   * Direct Smartphone Camera QR Scan Entry Point:
   * When a smartphone camera scans the permanent office QR code, it opens this URL.
   * The server immediately records the confirmation on the backend, ensuring the
   * desktop platform confirms the delivery in real-time, then redirects the phone
   * to the visual confirmation slip view.
   */
  app.get('/qr-auto-confirm', (req, res) => {
    const officeCode = String(req.query.officeCode || req.query.officeValidate || '').toUpperCase();
    const officeId = String(req.query.officeId || '');
    const staff = String(req.query.staff || 'Mobile Camera QR Scanner');

    if (officeCode || officeId) {
      const event: ConfirmedOfficeEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        officeCode,
        officeId: officeId || undefined,
        confirmedAt: new Date().toISOString(),
        confirmedBy: staff,
        source: 'mobile_qr_camera',
      };
      confirmedOfficeEvents.push(event);

      // Keep only recent 50 events to prevent unbounded growth
      if (confirmedOfficeEvents.length > 50) {
        confirmedOfficeEvents.shift();
      }

      console.log(`[QR-Sync] Real-time confirmation received for office: ${officeCode} (${officeId})`);
    }

    const redirectParams = new URLSearchParams({
      officeValidate: officeCode,
      officeId: officeId,
      autoConfirm: 'true',
      confirmedAt: new Date().toISOString(),
    });

    res.redirect(`/?${redirectParams.toString()}`);
  });

  /**
   * Endpoint for Mobile confirmation UI to confirm an office's pending deliveries
   */
  app.post('/api/qr/confirm-office', (req, res) => {
    const { officeCode, officeId, confirmedBy, deliveryId } = req.body || {};

    const cleanCode = officeCode ? String(officeCode).toUpperCase() : '';
    const cleanId = officeId ? String(officeId) : '';
    const staff = confirmedBy ? String(confirmedBy) : 'Tourism Office Reception Staff';

    const event: ConfirmedOfficeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      officeCode: cleanCode,
      officeId: cleanId || undefined,
      confirmedAt: new Date().toISOString(),
      confirmedBy: staff,
      source: 'mobile_auto_scan',
    };

    confirmedOfficeEvents.push(event);
    if (confirmedOfficeEvents.length > 50) {
      confirmedOfficeEvents.shift();
    }

    if (deliveryId) {
      confirmedDeliveryMap[deliveryId] = {
        deliveryId,
        officeId: cleanId,
        officeCode: cleanCode,
        confirmedAt: new Date().toISOString(),
        confirmedBy: staff,
      };
    }

    console.log(`[QR-Sync] API office confirmed: ${cleanCode} by ${staff}`);

    res.json({
      success: true,
      event,
      timestamp: Date.now(),
    });
  });

  /**
   * Endpoint for confirming a specific delivery record
   */
  app.post('/api/qr/confirm-delivery', (req, res) => {
    const { deliveryId, officeId, officeCode, confirmedBy } = req.body || {};

    if (!deliveryId) {
      return res.status(400).json({ success: false, error: 'deliveryId is required' });
    }

    const staff = confirmedBy || 'Mobile QR Scanner';
    const confirmedAt = new Date().toISOString();

    confirmedDeliveryMap[deliveryId] = {
      deliveryId,
      officeId,
      officeCode,
      confirmedAt,
      confirmedBy: staff,
    };

    res.json({
      success: true,
      deliveryId,
      confirmedAt,
      confirmedBy: staff,
    });
  });

  /**
   * Real-time sync polling endpoint called by desktop platform:
   * Returns all recent confirmation events and confirmed delivery IDs
   */
  app.get('/api/qr/sync', (req, res) => {
    const since = Number(req.query.since || 0);

    const newEvents = since > 0
      ? confirmedOfficeEvents.filter((e) => new Date(e.confirmedAt).getTime() > since)
      : confirmedOfficeEvents;

    res.json({
      success: true,
      events: newEvents,
      allEvents: confirmedOfficeEvents,
      confirmedDeliveries: confirmedDeliveryMap,
      serverTime: Date.now(),
    });
  });

  /**
   * Sync active deliveries snapshot from desktop to server
   */
  app.post('/api/qr/sync-deliveries', (req, res) => {
    const { deliveries } = req.body || {};
    if (Array.isArray(deliveries)) {
      latestDeliveriesSnapshot = deliveries;
    }
    res.json({ success: true, count: latestDeliveriesSnapshot.length });
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Initialize real-time WebSocket server attached to HTTP server
  wssInstance = new WebSocketServer({ server });

  wssInstance.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress || 'unknown';
    console.log(`[WS-Sync] Client connected from ${ip}`);

    // Send initial authoritative stock data and current program version immediately upon connection
    const currentStock = loadServerStock();
    if (currentStock) {
      ws.send(
        JSON.stringify({
          type: 'sync:init',
          data: currentStock,
          version: currentStock.version || '1.0.1',
          updatedAt: currentStock.updatedAt || Date.now(),
        })
      );
    }

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'sync:update' && parsed.data) {
          const saved = saveServerStock(parsed.data);
          if (saved) {
            broadcastStockUpdate(saved, parsed.clientId);
          }
        } else if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('[WS-Sync] Error handling message:', err);
      }
    });

    ws.on('error', (err) => {
      console.warn('[WS-Sync] Client error:', err);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlyerStock AHP Server] Running with Real-Time WebSockets on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
