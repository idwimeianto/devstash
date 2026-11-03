// Upload rules for the file and image item types, shared by FileUpload and the upload route.

export const UPLOAD_KINDS = ["file", "image"] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

const MB = 1024 * 1024;

interface UploadConstraint {
  maxSize: number;
  // Extension -> the MIME type the object is stored with.
  extensions: Record<string, string>;
  // MIME types a browser may report for an allowed extension.
  mimeTypes: string[];
}

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  image: {
    maxSize: 5 * MB,
    extensions: {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    },
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  },
  file: {
    maxSize: 10 * MB,
    extensions: {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".yaml": "application/x-yaml",
      ".yml": "application/x-yaml",
      ".xml": "application/xml",
      ".csv": "text/csv",
      ".toml": "application/toml",
      ".ini": "text/plain",
    },
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

// Browsers often report no type, or a generic one, for text formats like .md, .yaml and .toml.
const UNKNOWN_MIME_TYPES = new Set(["", "application/octet-stream"]);

export function isUploadKind(typeName: string): typeName is UploadKind {
  return (UPLOAD_KINDS as readonly string[]).includes(typeName);
}

// ".PNG" for "photo.PNG" is returned as ".png"; "" when there is no extension.
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot).toLowerCase() : "";
}

// The accept attribute for the file input, e.g. ".png,.jpg,…".
export function getAcceptAttribute(kind: UploadKind): string {
  return Object.keys(UPLOAD_CONSTRAINTS[kind].extensions).join(",");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

interface UploadCandidate {
  name: string;
  type: string;
  size: number;
}

// An error message, or null when the file is allowed for this kind.
export function validateUpload(kind: UploadKind, file: UploadCandidate): string | null {
  const { maxSize, extensions, mimeTypes } = UPLOAD_CONSTRAINTS[kind];
  const label = kind === "image" ? "Images" : "Files";

  if (!(getFileExtension(file.name) in extensions)) {
    return `${label} must be one of: ${Object.keys(extensions).join(", ")}`;
  }
  // Images always report their type; only text files may arrive without one.
  const typeAllowed =
    mimeTypes.includes(file.type) || (kind === "file" && UNKNOWN_MIME_TYPES.has(file.type));
  if (!typeAllowed) return "This file type isn't allowed";
  if (file.size === 0) return "This file is empty";
  if (file.size > maxSize) return `${label} can be at most ${formatFileSize(maxSize)}`;
  return null;
}

// The MIME type the object is stored and served with, picked by extension, not by the browser.
export function getStoredContentType(kind: UploadKind, fileName: string): string {
  return UPLOAD_CONSTRAINTS[kind].extensions[getFileExtension(fileName)];
}
