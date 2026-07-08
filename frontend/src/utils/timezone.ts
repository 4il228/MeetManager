import { format, parseISO } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const MSK_TZ = 'Europe/Moscow';

export function utcToMsk(utcString: string): Date {
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

export function mskToUtc(mskDate: Date): string {
  const utcDate = new Date(mskDate.getTime() - mskDate.getTimezoneOffset() * 60000);
  return format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
}
