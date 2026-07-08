import { format, parseISO } from 'date-fns';
import { TZDate } from '@date-fns/tz';

export const MSK_TZ = 'Europe/Moscow';

export function utcToMsk(utcString: string): TZDate {
  const utcDate = parseISO(utcString);
  return new TZDate(utcDate, MSK_TZ);
}

export function formatMsk(utcString: string, fmt: string): string {
  const mskDate = utcToMsk(utcString);
  return format(mskDate, fmt);
}

export function formatTimeRange(startUtc: string, endUtc: string): string {
  return `${formatMsk(startUtc, 'HH:mm')} - ${formatMsk(endUtc, 'HH:mm')}`;
}

export function getMskHour(utcString: string): number {
  const mskDate = utcToMsk(utcString);
  return mskDate.getHours();
}

export function getMskMinutes(utcString: string): number {
  const mskDate = utcToMsk(utcString);
  return mskDate.getMinutes();
}

/** Текущая дата/время в МСК */
export function mskNow(): TZDate {
  return new TZDate(new Date(), MSK_TZ);
}

/** Ключ дня yyyy-MM-dd в МСК */
export function mskDateKey(date: Date | TZDate): string {
  const msk = date instanceof TZDate ? date : new TZDate(date, MSK_TZ);
  return format(msk, 'yyyy-MM-dd');
}

/** datetime-local строка (МСК) из Date/TZDate */
export function toMskDatetimeLocal(date: Date | TZDate): string {
  const msk = date instanceof TZDate ? date : new TZDate(date, MSK_TZ);
  return format(msk, "yyyy-MM-dd'T'HH:mm");
}

/** datetime-local (МСК) → UTC ISO строка для API */
export function mskDatetimeLocalToUtc(localDatetime: string): string {
  const mskDate = new TZDate(`${localDatetime}:00`, MSK_TZ);
  const utcDate = new TZDate(mskDate, 'UTC');
  return format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
}
