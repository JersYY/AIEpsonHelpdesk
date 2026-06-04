-- Add a global, database-backed sequence number for tickets.
-- Existing tickets are backfilled once using creation order, then future
-- tickets receive the next value from the sequence atomically.

CREATE SEQUENCE "EscalationTicket_ticketNumber_seq";

ALTER TABLE "EscalationTicket"
ADD COLUMN "ticketNumber" INTEGER;

WITH numbered_tickets AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS "ticketNumber"
    FROM "EscalationTicket"
)
UPDATE "EscalationTicket"
SET "ticketNumber" = numbered_tickets."ticketNumber"
FROM numbered_tickets
WHERE "EscalationTicket"."id" = numbered_tickets."id";

SELECT setval(
    '"EscalationTicket_ticketNumber_seq"',
    COALESCE((SELECT MAX("ticketNumber") FROM "EscalationTicket"), 1),
    (SELECT COUNT(*) > 0 FROM "EscalationTicket")
);

ALTER TABLE "EscalationTicket"
ALTER COLUMN "ticketNumber" SET DEFAULT nextval('"EscalationTicket_ticketNumber_seq"');

ALTER SEQUENCE "EscalationTicket_ticketNumber_seq"
OWNED BY "EscalationTicket"."ticketNumber";

ALTER TABLE "EscalationTicket"
ALTER COLUMN "ticketNumber" SET NOT NULL;

CREATE UNIQUE INDEX "EscalationTicket_ticketNumber_key"
ON "EscalationTicket"("ticketNumber");
