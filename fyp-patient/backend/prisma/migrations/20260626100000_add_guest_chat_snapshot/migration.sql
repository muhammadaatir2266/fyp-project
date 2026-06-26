-- CreateTable
CREATE TABLE "GuestChatSnapshot" (
    "id" TEXT NOT NULL,
    "guestSessionId" TEXT NOT NULL,
    "predictions" JSONB NOT NULL,
    "symptoms" JSONB,
    "specialty" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestChatSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestChatSnapshot_guestSessionId_key" ON "GuestChatSnapshot"("guestSessionId");

-- CreateIndex
CREATE INDEX "GuestChatSnapshot_expiresAt_idx" ON "GuestChatSnapshot"("expiresAt");
