import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wlcnhpkjpstugzrtmcwh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsY25ocGtqcHN0dWd6cnRtY3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAzOTg1MSwiZXhwIjoyMDk2NjE1ODUxfQ.fELDOvjEcHW0pnDN2LgOjk0HL-5niqA8WKfpFfv_jS8';
const USER_ID = '43394240-9715-4a0e-8a2d-f6f13b31a3ae';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data, error } = await admin.auth.admin.createSession({ userId: USER_ID });
if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(JSON.stringify({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
}));
