// "Asia/Shanghai" is the IANA id for China Standard Time (there is no Asia/Beijing).
const BEIJING_TIME_ZONE = "Asia/Shanghai";
const HOUR_WORDS = ["十二", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十", "十一"];
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export interface BeijingClock {
  hour: number;
  minute: number;
  time: string;
  date: string;
  weekday: string;
  /** e.g. "凌晨一点", "下午三点", "午夜" */
  moment: string;
  isNight: boolean;
}

function hourWord(hour: number): string {
  return `${HOUR_WORDS[hour % 12]}点`;
}

export function describeHour(hour: number): string {
  if (hour === 0) return "午夜";
  if (hour <= 4) return `凌晨${hourWord(hour)}`;
  if (hour <= 7) return `清晨${hourWord(hour)}`;
  if (hour <= 10) return `上午${hourWord(hour)}`;
  if (hour <= 12) return `中午${hourWord(hour)}`;
  if (hour <= 17) return `下午${hourWord(hour)}`;
  if (hour === 18) return `傍晚${hourWord(hour)}`;
  if (hour <= 22) return `晚上${hourWord(hour)}`;
  return `深夜${hourWord(hour)}`;
}

export function readBeijingClock(now: Date): BeijingClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BEIJING_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const hour = Number(part("hour")) % 24;
  const minute = Number(part("minute"));
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));

  return {
    hour,
    minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    date: `${part("month")}/${part("day")}`,
    weekday: WEEKDAYS[weekdayIndex] ?? "",
    moment: describeHour(hour),
    isNight: hour >= 19 || hour < 6,
  };
}
