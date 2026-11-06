// A fixed locale and time zone, so the server and every browser render the same text.
function dateFormat(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
}

// "Nov 6"
export const SHORT_DATE = dateFormat({ month: "short", day: "numeric" });

// "Nov 6, 2026"
export const SHORT_DATE_WITH_YEAR = dateFormat({ month: "short", day: "numeric", year: "numeric" });

// "November 6, 2026"
export const LONG_DATE = dateFormat({ month: "long", day: "numeric", year: "numeric" });
