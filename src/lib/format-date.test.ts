import { describe, expect, it } from "vitest";

import { LONG_DATE, SHORT_DATE, SHORT_DATE_WITH_YEAR } from "@/lib/format-date";

describe("date formats", () => {
  const DATE = new Date("2026-11-06T12:00:00Z");

  it("formats each style", () => {
    expect(SHORT_DATE.format(DATE)).toBe("Nov 6");
    expect(SHORT_DATE_WITH_YEAR.format(DATE)).toBe("Nov 6, 2026");
    expect(LONG_DATE.format(DATE)).toBe("November 6, 2026");
  });

  it("uses UTC, so dates near midnight don't shift with the machine's time zone", () => {
    expect(SHORT_DATE.format(new Date("2026-11-06T23:59:59Z"))).toBe("Nov 6");
    expect(SHORT_DATE.format(new Date("2026-11-06T00:00:00Z"))).toBe("Nov 6");
  });
});
