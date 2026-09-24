import type { Config } from '@netlify/functions';
import { and, eq, notInArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { inventoryRecords } from '../../db/schema.js';

const COLLECTIONS = ['flyers', 'offices', 'deliveries', 'batches', 'fairs', 'otherDeliveries'] as const;
const OVERRIDES_KIND = 'metricOverrides';

type CollectionName = (typeof COLLECTIONS)[number];
type InventoryState = Record<CollectionName, Array<Record<string, unknown>>> & {
  metricOverrides: Record<string, Record<string, unknown>>;
};

const emptyState = (): InventoryState => ({
  flyers: [],
  offices: [],
  deliveries: [],
  batches: [],
  fairs: [],
  otherDeliveries: [],
  metricOverrides: {},
});

export default async (request: Request) => {
  if (request.method === 'GET') {
    const rows = await db.select().from(inventoryRecords);
    const state = emptyState();

    for (const row of rows) {
      if (row.kind === OVERRIDES_KIND) {
        state.metricOverrides[row.recordId] = row.payload as Record<string, unknown>;
      } else if (COLLECTIONS.includes(row.kind as CollectionName)) {
        state[row.kind as CollectionName].push(row.payload as Record<string, unknown>);
      }
    }

    return Response.json({ state, initialized: rows.length > 0 });
  }

  if (request.method === 'PUT') {
    const body = (await request.json()) as { state?: Partial<InventoryState> };
    if (!body.state) return Response.json({ error: 'Inventory state is required.' }, { status: 400 });

    await db.transaction(async (tx) => {
      for (const kind of COLLECTIONS) {
        const records = Array.isArray(body.state?.[kind]) ? body.state[kind]! : [];
        const ids = records.map((record) => String(record.id || '')).filter(Boolean);

        if (ids.length) {
          await tx.delete(inventoryRecords).where(
            and(eq(inventoryRecords.kind, kind), notInArray(inventoryRecords.recordId, ids)),
          );
        } else {
          await tx.delete(inventoryRecords).where(eq(inventoryRecords.kind, kind));
        }

        for (const record of records) {
          const recordId = String(record.id || '');
          if (!recordId) continue;
          await tx
            .insert(inventoryRecords)
            .values({ kind, recordId, payload: record, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: [inventoryRecords.kind, inventoryRecords.recordId],
              set: { payload: record, updatedAt: new Date() },
            });
        }
      }

      const overrides = body.state.metricOverrides || {};
      const overrideIds = Object.keys(overrides);
      if (overrideIds.length) {
        await tx.delete(inventoryRecords).where(
          and(eq(inventoryRecords.kind, OVERRIDES_KIND), notInArray(inventoryRecords.recordId, overrideIds)),
        );
      } else {
        await tx.delete(inventoryRecords).where(eq(inventoryRecords.kind, OVERRIDES_KIND));
      }

      for (const [recordId, payload] of Object.entries(overrides)) {
        await tx
          .insert(inventoryRecords)
          .values({ kind: OVERRIDES_KIND, recordId, payload, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: [inventoryRecords.kind, inventoryRecords.recordId],
            set: { payload, updatedAt: new Date() },
          });
      }
    });

    return Response.json({ success: true });
  }

  return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, PUT' } });
};

export const config: Config = { path: '/api/inventory' };
