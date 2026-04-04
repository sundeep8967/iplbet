/**
 * scrapeMatchResult.js
 *
 * Playwright scraper: searches Google for an IPL match result
 * and returns the winning team name, or null if not found.
 *
 * Usage (standalone test):
 *   node scripts/scrapeMatchResult.js "Royal Challengers Bengaluru" "Chennai Super Kings" "April 5"
 */

import { chromium } from 'playwright';

// Canonical short names Google uses in its sports card
// Maps our full team name → short abbreviation variants Google might display
const TEAM_ALIASES = {
  'Royal Challengers Bengaluru': ['RCB', 'Royal Challengers Bangalore', 'Royal Challengers Bengaluru'],
  'Chennai Super Kings':         ['CSK', 'Chennai Super Kings'],
  'Mumbai Indians':              ['MI', 'Mumbai Indians'],
  'Kolkata Knight Riders':       ['KKR', 'Kolkata Knight Riders'],
  'Sunrisers Hyderabad':         ['SRH', 'Sunrisers Hyderabad'],
  'Rajasthan Royals':            ['RR', 'Rajasthan Royals'],
  'Punjab Kings':                ['PBKS', 'Punjab Kings'],
  'Delhi Capitals':              ['DC', 'Delhi Capitals'],
  'Gujarat Titans':              ['GT', 'Gujarat Titans'],
  'Lucknow Super Giants':        ['LSG', 'Lucknow Super Giants'],
};

/**
 * Given a raw result text from Google (e.g. "RCB won by 7 wickets"),
 * map it back to the canonical full team name.
 *
 * @param {string} text
 * @param {string} team1  full name
 * @param {string} team2  full name
 * @returns {string|null}
 */
function resolveWinner(text, team1, team2) {
  const lower = text.toLowerCase();
  for (const [fullName, aliases] of Object.entries(TEAM_ALIASES)) {
    // Only consider the two teams that played
    if (fullName !== team1 && fullName !== team2) continue;
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return fullName;
      }
    }
  }
  return null;
}

/**
 * Scrape Google for the IPL match result.
 *
 * @param {string} team1  e.g. "Royal Challengers Bengaluru"
 * @param {string} team2  e.g. "Chennai Super Kings"
 * @param {string} date   e.g. "April 5"
 * @returns {Promise<string|null>} winning team full name or null
 */
export async function scrapeMatchResult(team1, team2, date) {
  const query = `${team1} vs ${team2} IPL 2025 ${date} match result winner`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=in`;

  console.log(`\n🔍 Searching: ${query}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    // Disable webdriver flag that Google detects
    javaScriptEnabled: true,
  });
  // Remove playwright detection markers
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  try {
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 20_000 });

    // Dismiss Google's cookie/consent popup if it appears (common in some regions)
    try {
      const acceptBtn = page.locator('button:has-text("Accept all"), button:has-text("I agree")');
      if (await acceptBtn.count() > 0) {
        await acceptBtn.first().click();
        await page.waitForLoadState('networkidle', { timeout: 5_000 });
      }
    } catch (_) {}

    // ── STRATEGY 1: Google Sports Card selectors ─────────────────────────────
    const sportsCandidates = [
      '[data-attrid*="winner"] span',
      '.imso_mh__tw-km-hd',
      '.b0c3B',                          // score card result line
      '.iXqz2e',                         // "won by X wickets" text
      '.MUxGbd.lyLwlc',                  // result snippet text
      '.BNeawe.iBp4i',                   // top snippet bold text
      '.r0bn4c.rQMQod',                  // secondary snippet text
    ];

    for (const selector of sportsCandidates) {
      try {
        const els = await page.$$(selector);
        for (const el of els) {
          const text = (await el.innerText()).trim();
          if (text.toLowerCase().includes('won')) {
            console.log(`  ✅ Sports card hit [${selector}]: "${text}"`);
            const winner = resolveWinner(text, team1, team2);
            if (winner) {
              console.log(`  🏆 Winner resolved: ${winner}`);
              return winner;
            }
          }
        }
      } catch (_) {}
    }

    // ── STRATEGY 2: Full body text scan ─────────────────────────────────────
    // Get entire rendered page text and scan line by line
    const bodyText = await page.evaluate(() => document.body.innerText);
    const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (line.toLowerCase().includes('won')) {
        console.log(`  📝 Body scan match: "${line}"`);
        const winner = resolveWinner(line, team1, team2);
        if (winner) {
          console.log(`  🏆 Winner resolved: ${winner}`);
          return winner;
        }
      }
    }

    console.log('  ❌ Could not find result on page.');
    return null;

  } finally {
    await browser.close();
  }
}

// ─── Standalone CLI test ─────────────────────────────────────────────────────
// Run: node scripts/scrapeMatchResult.js "Team1" "Team2" "April 5"
if (process.argv[1].endsWith('scrapeMatchResult.js')) {
  const [,, team1, team2, date] = process.argv;
  if (!team1 || !team2 || !date) {
    console.error('Usage: node scripts/scrapeMatchResult.js "Team1" "Team2" "April 5"');
    process.exit(1);
  }
  scrapeMatchResult(team1, team2, date)
    .then(winner => {
      if (winner) console.log(`\n✅ WINNER: ${winner}`);
      else        console.log('\n⚠️  Result not available yet.');
      process.exit(0);
    })
    .catch(err => { console.error(err); process.exit(1); });
}
