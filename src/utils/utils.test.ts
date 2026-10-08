import { describe, expect, it } from "vitest";

import { addDaysToIsoDate, getTodayIst, isValidIsoDate } from "./date";
import { isValidEmail, normalizeEmail } from "./email";
import {
  addMonths,
  daysInMonth,
  getCurrentMonth,
  getDefaultCalendarMonth,
  isValidMonth,
} from "./month";

describe("email", () => {
  it("treats Gmail addresses that differ by case, dots or +tag as one account", () => {
    const same = [
      "Noufal.Globosoft@gmail.com",
      "noufalglobosoft@gmail.com",
      "noufal.globosoft+pms@gmail.com",
      "noufalglobosoft@googlemail.com",
    ];

    for (const email of same) {
      expect(normalizeEmail(email)).toBe("noufalglobosoft@gmail.com");
    }
  });

  it("keeps dots and +tags for other domains (only lower-cases them)", () => {
    expect(normalizeEmail("Anu.Mathew+x@Example.com")).toBe("anu.mathew+x@example.com");
  });

  it("checks the shape of an address", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("  a@b.co  ")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail(`${"x".repeat(250)}@b.co`)).toBe(false);
  });
});

describe("months (the month changes at midnight in India)", () => {
  it("is already the next month at 18:30 UTC on the last day", () => {
    expect(getCurrentMonth(new Date("2026-10-31T18:29:00Z"))).toBe("2026-10");
    expect(getCurrentMonth(new Date("2026-10-31T18:30:00Z"))).toBe("2026-11");
  });

  it("rolls over a year", () => {
    expect(getCurrentMonth(new Date("2026-12-31T18:30:00Z"))).toBe("2027-01");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-10", 14)).toBe("2027-12");
  });

  it("validates YYYY-MM", () => {
    expect(isValidMonth("2026-11")).toBe(true);
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-00")).toBe(false);
    expect(isValidMonth("26-11")).toBe(false);
  });

  it("knows how long a month is, leap years included", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2026-10")).toBe(31);
  });

  it("opens the calendar on next month in the last 7 days", () => {
    expect(getDefaultCalendarMonth(new Date("2026-10-24T06:00:00Z"))).toBe("2026-10");
    expect(getDefaultCalendarMonth(new Date("2026-10-25T06:00:00Z"))).toBe("2026-11");
  });
});

describe("dates", () => {
  it("accepts real calendar dates only", () => {
    expect(isValidIsoDate("2026-10-08")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
  });

  it("says what day it is in India, not in UTC", () => {
    // 18:45 UTC on the 6th is 00:15 on the 7th in India
    expect(getTodayIst(new Date("2026-10-06T18:45:00Z"))).toBe("2026-10-07");
    expect(getTodayIst(new Date("2026-10-06T18:29:00Z"))).toBe("2026-10-06");
  });

  it("adds days across month ends", () => {
    expect(addDaysToIsoDate("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDaysToIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});
