import { parse } from 'date-fns';

const MATCH_DATE_FORMAT = 'MMMM d yyyy h:mm a';
const MATCH_REFERENCE_DATE_UTC = new Date(Date.UTC(2026, 0, 1));
const IST_OFFSET_MINUTES = 330;

/**
 * Parse schedule date/time provided in IST and return UTC Date.
 */
export function parseMatchDateTimeUTC(date, time, year = 2026) {
  const parsed = parse(
    `${date} ${year} ${time}`,
    MATCH_DATE_FORMAT,
    MATCH_REFERENCE_DATE_UTC
  );

  const asUtcFromParts = Date.UTC(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    parsed.getHours(),
    parsed.getMinutes(),
    parsed.getSeconds(),
    parsed.getMilliseconds()
  );

  // Input times are IST wall-clock values; convert to absolute UTC instant.
  return new Date(asUtcFromParts - IST_OFFSET_MINUTES * 60 * 1000);
}
