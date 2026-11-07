import { describe, expect, it } from "vitest";
import { getBirthdayProgress } from "../lib/time-progress";

describe("getBirthdayProgress", () => {
  it("starts a new cycle on the birthday", () => {
    const result = getBirthdayProgress(new Date(2026, 0, 9, 0, 0, 0));

    expect(result.birthdayPercent).toBe(0);
    expect(result.daysUntilBirthday).toBe(365);
  });

  it("reports one day immediately before the birthday", () => {
    const result = getBirthdayProgress(new Date(2026, 0, 8, 12, 0, 0));

    expect(result.birthdayPercent).toBeGreaterThan(99);
    expect(result.daysUntilBirthday).toBe(1);
  });

  it("accounts for leap years", () => {
    const result = getBirthdayProgress(new Date(2024, 6, 10, 0, 0, 0));

    expect(result.birthdayPercent).toBeGreaterThan(49);
    expect(result.birthdayPercent).toBeLessThan(51);
    expect(result.daysUntilBirthday).toBe(183);
  });
});
