import express from 'express';
import path from 'path';
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

// Global in-memory storage for real-time cross-device synchronization
const confirmedOfficeEvents: ConfirmedOfficeEvent[] = [];
const confirmedDeliveryMap: Record<string, ConfirmedDeliveryItem> = {};
let latestDeliveriesSnapshot: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlyerStock AHP Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
