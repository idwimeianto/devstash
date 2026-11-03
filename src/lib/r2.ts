import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// R2 speaks the S3 API; the client is created on first use so builds and tests don't need the env.
let client: S3Client | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function getClient(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    // Only send checksums when an operation needs them; R2 doesn't support every default one.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

function getBucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

function getPublicBaseUrl(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
}

export function getPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

// The object key behind one of our public URLs, or null for any other URL.
export function getKeyFromPublicUrl(url: string): string | null {
  const prefix = `${getPublicBaseUrl()}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  // Keys are generated as "<userId>/<random><ext>"; anything else isn't ours.
  return /^[\w-]+\/[\w-]+(\.[a-z0-9]+)?$/.test(key) ? key : null;
}

interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
  contentDisposition?: string;
}

export async function putObject({ key, body, contentType, contentDisposition }: PutObjectInput) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentDisposition: contentDisposition,
    }),
  );
}

// The object's size in bytes, or null when it doesn't exist.
export async function getObjectSize(key: string): Promise<number | null> {
  try {
    const head = await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return head.ContentLength ?? null;
  } catch (error) {
    if (error instanceof Error && error.name === "NotFound") return null;
    throw error;
  }
}

export async function getObject(key: string) {
  return getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function deleteObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
