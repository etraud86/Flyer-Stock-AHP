CREATE TABLE "inventory_records" (
	"kind" text,
	"record_id" text,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_records_pkey" PRIMARY KEY("kind","record_id")
);
