-- Index UNIQUE PARTIEL anti-doublon de file de relance.
-- Garantit l'unicité de (invoiceId, offsetDays, deliveryMode) UNIQUEMENT pour
-- les events "actifs" : en file (SCHEDULED) ou envoyés (SENT). Les events
-- FAILED en sont exclus, ce qui autorise un nouvel essai après un échec.
CREATE UNIQUE INDEX "uniq_reminder_active"
  ON "ReminderEvent" ("invoiceId", "offsetDays", "deliveryMode")
  WHERE status IN ('SCHEDULED', 'SENT');
