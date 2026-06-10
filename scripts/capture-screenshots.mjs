import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', '.screenshots');
mkdirSync(outDir, { recursive: true });

const BASE = 'http://localhost:3003';
const EMAIL = 'marenasouleymane81@gmail.com';
const PASSWORD = 'payback2026!';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// ── 1. Landing page — section Tarifs ─────────────────────────────────────────
console.log('📸 Landing / Tarifs…');
await page.goto(BASE, { waitUntil: 'networkidle' });

// Try to scroll to the pricing section
const pricingSection = page.locator('#tarifs, [id*="tarif"], [id*="pric"], section:has-text("Tarif"), section:has-text("Pricing")').first();
let found = false;
try {
  await pricingSection.waitFor({ timeout: 3000 });
  await pricingSection.scrollIntoViewIfNeeded();
  found = true;
} catch {
  // Fallback: scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
}
await page.waitForTimeout(600);
await page.screenshot({ path: join(outDir, '1-landing-tarifs.png'), fullPage: false });
console.log('  saved 1-landing-tarifs.png', found ? '(section found)' : '(scrolled 50%)');

// ── 2. Login ──────────────────────────────────────────────────────────────────
console.log('🔐 Login…');
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
// Wait for the React-hydrated form to be interactive
await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
await page.fill('#email', EMAIL);
await page.fill('#password', PASSWORD);
// Verify fill worked
const filledEmail = await page.inputValue('#email');
console.log('  Email field value:', filledEmail);
// Submit and wait for navigation
await Promise.all([
  page.waitForURL(url => !url.includes('/login'), { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(2000); // let middleware & DB settle
console.log('  Current URL after login:', page.url());
// Check for error message
const errMsg = await page.locator('.text-destructive').textContent().catch(() => null);
if (errMsg) console.log('  Error on page:', errMsg);

// ── 3. Settings — Abonnement card ────────────────────────────────────────────
console.log('📸 Settings / Abonnement…');
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
const subCard = page.locator('[data-section="subscription"], section:has-text("Abonnement"), div:has-text("Abonnement")').first();
try {
  await subCard.waitFor({ timeout: 3000 });
  await subCard.scrollIntoViewIfNeeded();
} catch {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}
await page.waitForTimeout(600);
await page.screenshot({ path: join(outDir, '2-settings-abonnement.png'), fullPage: false });
console.log('  saved 2-settings-abonnement.png');

// ── 4. Invoices — batch button disabled ──────────────────────────────────────
console.log('📸 Invoices / batch button…');
await page.goto(`${BASE}/invoices`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: join(outDir, '3-invoices-batch.png'), fullPage: false });
console.log('  saved 3-invoices-batch.png');

await browser.close();
console.log('\n✅ All screenshots saved to .screenshots/');
