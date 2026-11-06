import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const DEFAULT_FROM = "DevStash <noreply@devstash.idwimeianto.com>";
const TO = "user@example.com";
const URL = "https://devstash.test/link";

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  send.mockResolvedValue({ error: null });
});

describe("email sender", () => {
  it("uses the default when RESEND_FROM is missing", async () => {
    vi.stubEnv("RESEND_FROM", undefined);

    await sendVerificationEmail(TO, URL);

    expect(send.mock.calls[0][0].from).toBe(DEFAULT_FROM);
  });

  it("uses the default when RESEND_FROM is empty", async () => {
    vi.stubEnv("RESEND_FROM", "");

    await sendPasswordResetEmail(TO, URL);

    expect(send.mock.calls[0][0].from).toBe(DEFAULT_FROM);
  });

  it("uses RESEND_FROM when it is set", async () => {
    vi.stubEnv("RESEND_FROM", "Other <hello@example.com>");

    await sendVerificationEmail(TO, URL);

    expect(send.mock.calls[0][0].from).toBe("Other <hello@example.com>");
  });
});

describe("email errors", () => {
  it("throws when Resend reports an error", async () => {
    send.mockResolvedValue({ error: { message: "rejected" } });

    await expect(sendVerificationEmail(TO, URL)).rejects.toThrow(
      "Failed to send verification email: rejected",
    );
  });
});
