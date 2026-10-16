/**
 * Vietnam Timezone (Asia/Ho_Chi_Minh, GMT+7) Shared Time Utilities
 * Pure Native Intl (Zero External Dependencies)
 */

const vnDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const vnHourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: 'numeric',
  hour12: false,
});

/**
 * Get date string (YYYY-MM-DD) and hour (0-23) in Vietnam timezone (GMT+7)
 */
export function getVnTimeParts(dateObj = new Date()) {
  const dateStr = vnDateFormatter.format(dateObj); // YYYY-MM-DD
  const hour = parseInt(vnHourFormatter.format(dateObj), 10) % 24;
  return { dateStr, hour };
}

export function getVnDateString(dateObj = new Date()): string {
  return vnDateFormatter.format(dateObj);
}
