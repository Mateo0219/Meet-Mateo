const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export interface BirthdayProgress {
  birthdayPercent: number;
  daysUntilBirthday: number;
}

function asCalendarTimestamp(date: Date): number {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

export function getBirthdayProgress(
  now: Date,
  birthdayMonth = 0,
  birthdayDay = 9
): BirthdayProgress {
  const currentYear = now.getFullYear();
  const birthdayThisYear = new Date(currentYear, birthdayMonth, birthdayDay);

  const previousBirthday =
    now >= birthdayThisYear
      ? birthdayThisYear
      : new Date(currentYear - 1, birthdayMonth, birthdayDay);
  const nextBirthday =
    now >= birthdayThisYear
      ? new Date(currentYear + 1, birthdayMonth, birthdayDay)
      : birthdayThisYear;

  const start = asCalendarTimestamp(previousBirthday);
  const end = asCalendarTimestamp(nextBirthday);
  const current = asCalendarTimestamp(now);
  const birthdayPercent = Math.min(
    100,
    Math.max(0, ((current - start) / (end - start)) * 100)
  );
  const daysUntilBirthday = Math.max(
    0,
    Math.ceil((end - current) / MILLISECONDS_PER_DAY)
  );

  return {
    birthdayPercent: Math.round(birthdayPercent * 100) / 100,
    daysUntilBirthday,
  };
}
