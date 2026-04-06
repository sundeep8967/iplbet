/**
 * scrapeMatchResult.js
 *
 * Playwright scraper: searches Google for an IPL match result
 * and returns the winning team name, or null if not found.
 *
 * Usage (standalone test):
 *   node scripts/scrapeMatchResult.js "Royal Challengers Bengaluru" "Chennai Super Kings" "April 5"
 */

// We dynamically import playwright based on the environment to support Vercel Serverless

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

// Import MISC_RESULTS for consistent result strings
const { MISC_RESULTS } = await import('../src/models/constants.js');

/**
 * Given a raw result text from Google (e.g. "DC won by 6 wickets"),
 * map it back to the canonical full team name.
 *
 * IMPORTANT: we REQUIRE the text to also mention the OTHER team so that
 * stray "MI won" headlines from unrelated matches on the same page can't
 * pollute the result.
 *
 * @param {string} text
 * @param {string} team1  full name
 * @param {string} team2  full name
 * @returns {string|null}
 */
function resolveWinner(text, team1, team2) {
  const lower = text.toLowerCase();

  const aliases1 = TEAM_ALIASES[team1] ?? [team1];
  const aliases2 = TEAM_ALIASES[team2] ?? [team2];

  // Both teams must appear somewhere in the text (confirms it's this fixture)
  const team1Mentioned = aliases1.some(a => lower.includes(a.toLowerCase()));
  const team2Mentioned = aliases2.some(a => lower.includes(a.toLowerCase()));
  if (!team1Mentioned || !team2Mentioned) return null;

  // Check for Draws / Cancellations / Abandonment
  const miscKeywords = [
    { keys: ['match drawn', 'match tied', 'drawn'], result: MISC_RESULTS.DRAW },
    { keys: ['match abandoned', 'no result', 'match cancelled', 'abandoned', 'cancelled'], result: MISC_RESULTS.CANCELLED },
  ];

  for (const group of miscKeywords) {
    if (group.keys.some(k => lower.includes(k))) {
      return group.result;
    }
  }

  // Require 'won by' — filters out toss results, "who won?" questions, etc.
  const wonByIdx = lower.indexOf('won by');
  if (wonByIdx === -1) return null;

  // Winner is the alias that appears CLOSEST before 'won by' (within 60 chars)
  // This handles scorecard blobs like: "CSK 209/5 ... PBKS 210/5 PBKS won by 5 wkts"
  const WINDOW = 60;
  const contextBefore = lower.slice(Math.max(0, wonByIdx - WINDOW), wonByIdx);

  let bestWinner = null;
  let bestIdx    = -1;

  for (const alias of aliases1) {
    const idx = contextBefore.lastIndexOf(alias.toLowerCase());
    if (idx !== -1 && idx > bestIdx) { bestIdx = idx; bestWinner = team1; }
  }
  for (const alias of aliases2) {
    const idx = contextBefore.lastIndexOf(alias.toLowerCase());
    if (idx !== -1 && idx > bestIdx) { bestIdx = idx; bestWinner = team2; }
  }

  return bestWinner;
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

  let browser;
  if (process.env.VERCEL || process.env.AWS_REGION) {
    // Vercel Serverless environment: Use lightweight chromium
    const chromium = (await import('@sparticuz/chromium')).default;
    const { chromium: playwrightCore } = await import('playwright-core');
    
    // Sparticuz requires you to pass the executablePath and args
    browser = await playwrightCore.launch({
      args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Local development: Use full playwright
    const { chromium: localChromium } = await import('playwright');
    browser = await localChromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });
  }

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

    // ── STRATEGY 2: Sliding-window body scan ─────────────────────────────────
    // Google's sports card splits across multiple lines, e.g.:
    //   "KKR  183/4"
    //   "SRH  179/8"
    //   "KKR won by 4 wickets"
    // A single-line scan misses this. We join every N consecutive lines into
    // a chunk and check each chunk for both teams + "won by".
    const aliases1 = TEAM_ALIASES[team1] ?? [team1];
    const aliases2 = TEAM_ALIASES[team2] ?? [team2];

    const mentionsTeam = (text, aliases) =>
      aliases.some(a => text.toLowerCase().includes(a.toLowerCase()));

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lines    = bodyText.split('\n').map(l => l.trim()).filter(Boolean);

    const WINDOW_SIZE = 6; // join up to 6 consecutive lines into one chunk
    for (let i = 0; i < lines.length; i++) {
      const chunk = lines.slice(i, i + WINDOW_SIZE).join(' ');
      const lower = chunk.toLowerCase();
      if (!lower.includes('won by')) continue;
      if (!mentionsTeam(chunk, aliases1) || !mentionsTeam(chunk, aliases2)) continue;
      console.log(`  📝 Window match [${i}–${i + WINDOW_SIZE - 1}]: "${chunk.slice(0, 160)}"`);
      const winner = resolveWinner(chunk, team1, team2);
      if (winner) {
        console.log(`  🏆 Winner resolved: ${winner}`);
        return winner;
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
