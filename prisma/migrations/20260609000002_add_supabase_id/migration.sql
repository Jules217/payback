-- Add supabaseId to User model for Supabase Auth integration.
-- Nullable so existing demo seed data (user_demo_payback) is unaffected.
ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT;
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
