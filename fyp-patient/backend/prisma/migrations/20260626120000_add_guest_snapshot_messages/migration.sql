-- AlterTable: add nullable messages column to GuestChatSnapshot
ALTER TABLE "GuestChatSnapshot" ADD COLUMN "messages" JSONB;
