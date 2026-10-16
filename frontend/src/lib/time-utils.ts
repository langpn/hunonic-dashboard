/**
 * Vietnam Timezone (Asia/Ho_Chi_Minh, GMT+7) Date Utilities
 * Prevents UTC shift bugs (e.g. 02:19 AM in Vietnam shifting to yesterday in UTC)
 */

const vnDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

export function getVnDateString(date: Date = new Date()): string {
  return vnDateFormatter.format(date); // Always returns YYYY-MM-DD in Vietnam time
}

export function isSameVnDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? date1 : getVnDateString(date1);
  const d2 = typeof date2 === 'string' ? date2 : getVnDateString(date2);
  return d1 === d2;
}
