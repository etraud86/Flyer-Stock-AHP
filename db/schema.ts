import { jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export const inventoryRecords = pgTable(
  'inventory_records',
  {
    kind: text().notNull(),
    recordId: text('record_id').notNull(),
    payload: jsonb().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.kind, table.recordId] })],
);
