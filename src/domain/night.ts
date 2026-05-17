import type { Place } from '../types';

const RESET_HOUR = 6;

export function zonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

export function getNightDate(date: Date, timeZone: string, resetHour = RESET_HOUR) {
  const local = zonedDateParts(date, timeZone);
  const localMidnight = Date.UTC(local.year, local.month - 1, local.day);
  const nightMidnight = local.hour < resetHour ? localMidnight - 24 * 60 * 60 * 1000 : localMidnight;

  return new Date(nightMidnight).toISOString().slice(0, 10);
}

export function getNightKey(timeZone: string, date = new Date()) {
  return `${timeZone}:${getNightDate(date, timeZone)}`;
}

export function getNightKeyForPlace(place: Pick<Place, 'timezone'>, date = new Date()) {
  return getNightKey(place.timezone, date);
}

export function getTonightLabel(timeZone: string, date = new Date()) {
  const nightDate = getNightDate(date, timeZone);
  return `Serata ${nightDate}, reset alle 06:00`;
}
