import { beforeEach, describe, expect, it, vi } from "vitest";

import { getKeyFromPublicUrl, getObjectSize, getPublicUrl } from "@/lib/r2";

const send = vi.hoisted(() => vi.fn());

// A fake S3 client: commands keep their input so tests can check what was sent.
vi.mock("@aws-sdk/client-s3", () => {
  class Command {
    constructor(public input: unknown) {}
  }
  return {
    S3Client: class {
      send = send;
    },
    HeadObjectCommand: class HeadObjectCommand extends Command {},
    GetObjectCommand: class GetObjectCommand extends Command {},
    PutObjectCommand: class PutObjectCommand extends Command {},
    DeleteObjectCommand: class DeleteObjectCommand extends Command {},
  };
});

// Env stubs are reset after each test by the Vitest config.
beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", "https://pub-test.r2.dev/");
  vi.stubEnv("R2_ACCOUNT_ID", "account");
  vi.stubEnv("R2_ACCESS_KEY_ID", "key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
  vi.stubEnv("R2_BUCKET_NAME", "devstash");
});

describe("R2 public URLs", () => {
  it("builds the public URL for a key without a double slash", () => {
    expect(getPublicUrl("user1/abc-123.png")).toBe("https://pub-test.r2.dev/user1/abc-123.png");
  });

  it("reads the key back from one of our URLs", () => {
    expect(getKeyFromPublicUrl("https://pub-test.r2.dev/user1/abc-123.png")).toBe(
      "user1/abc-123.png",
    );
  });

  it("returns null for other hosts and malformed keys", () => {
    expect(getKeyFromPublicUrl("https://evil.example/user1/abc.png")).toBeNull();
    expect(getKeyFromPublicUrl("https://pub-test.r2.dev/../user2/abc.png")).toBeNull();
    expect(getKeyFromPublicUrl("https://pub-test.r2.dev/abc.png")).toBeNull();
    expect(getKeyFromPublicUrl("https://pub-test.r2.dev/user1/a/b.png")).toBeNull();
  });

  it("throws a clear error when the public URL isn't configured", () => {
    vi.stubEnv("R2_PUBLIC_URL", "");

    expect(() => getPublicUrl("user1/abc.png")).toThrow("R2_PUBLIC_URL is not set");
  });
});

describe("getObjectSize", () => {
  it("returns the object's size from a HEAD request on the bucket", async () => {
    send.mockResolvedValue({ ContentLength: 4096 });

    await expect(getObjectSize("user1/abc.png")).resolves.toBe(4096);
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: "devstash", Key: "user1/abc.png" });
  });

  it("returns null when the object doesn't exist", async () => {
    send.mockRejectedValue(Object.assign(new Error("Not Found"), { name: "NotFound" }));

    await expect(getObjectSize("user1/missing.png")).resolves.toBeNull();
  });

  it("rethrows other R2 errors", async () => {
    send.mockRejectedValue(new Error("Access Denied"));

    await expect(getObjectSize("user1/abc.png")).rejects.toThrow("Access Denied");
  });
});
