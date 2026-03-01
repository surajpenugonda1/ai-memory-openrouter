ALTER TABLE "messages" ADD COLUMN "reasoning" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sources" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "details" jsonb;