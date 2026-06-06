CREATE TABLE "TicketComment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketComment_ticketId_createdAt_idx" ON "TicketComment"("ticketId", "createdAt");
CREATE INDEX "TicketComment_authorId_idx" ON "TicketComment"("authorId");

ALTER TABLE "TicketComment"
ADD CONSTRAINT "TicketComment_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "EscalationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketComment"
ADD CONSTRAINT "TicketComment_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
