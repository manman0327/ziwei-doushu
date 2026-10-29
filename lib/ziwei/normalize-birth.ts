import type { BirthInfo } from './types';
import {
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  shiftGregorianDate,
  type LateZishiRule,
} from './true-solar-time';

export interface KnownBirthInput {
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  gender: BirthInfo['gender'];
  name?: string;
  province?: string;
  city?: string;
  longitude?: number;
  utcOffsetMinutes?: number;
  lateZishi?: LateZishiRule;
}

/** Empty values must not silently become midnight. */
export function parseClockPart(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const part = Number(value);
  return Number.isInteger(part) && part >= 0 && part <= max ? part : null;
}

/** Input clock time must already have any user-confirmed DST adjustment applied. */
export function normalizeKnownBirth(input: KnownBirthInput): BirthInfo {
  const { clockHour, clockMinute, utcOffsetMinutes, lateZishi = 'next-day', ...birth } = input;
  if (!Number.isInteger(clockHour) || clockHour < 0 || clockHour > 23 ||
      !Number.isInteger(clockMinute) || clockMinute < 0 || clockMinute > 59) {
    throw new RangeError('出生时间无效');
  }
  if (birth.longitude !== undefined &&
      (!Number.isFinite(birth.longitude) || Math.abs(birth.longitude) > 180)) {
    throw new RangeError('出生地经度无效');
  }
  if (utcOffsetMinutes !== undefined &&
      (!Number.isInteger(utcOffsetMinutes) || utcOffsetMinutes < -720 || utcOffsetMinutes > 840)) {
    throw new RangeError('出生地标准时区偏移无效');
  }
  const solar = calculateTrueSolarTime({ ...birth, clockHour, clockMinute, utcOffsetMinutes });
  if (!solar.dateValid) throw new RangeError('出生日期不存在');
  const chartDate = shiftGregorianDate(birth, resolveZiweiDayOffset(solar, lateZishi));
  return {
    ...birth,
    ...chartDate,
    hour: solar.branch,
    origInput: {
      year: birth.year, month: birth.month, day: birth.day, clockHour, clockMinute,
    },
  };
}
