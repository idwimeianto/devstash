import { describe, expect, it } from "vitest";

import {
  formatFileSize,
  getAcceptAttribute,
  getFileExtension,
  getStoredContentType,
  isUploadKind,
  UPLOAD_CONSTRAINTS,
  validateUpload,
} from "@/lib/file-upload";

const MB = 1024 * 1024;

describe("getFileExtension", () => {
  it("returns the lowercased last extension", () => {
    expect(getFileExtension("photo.PNG")).toBe(".png");
    expect(getFileExtension("archive.tar.json")).toBe(".json");
  });

  it("returns an empty string without an extension or for dotfiles", () => {
    expect(getFileExtension("README")).toBe("");
    expect(getFileExtension(".env")).toBe("");
  });
});

describe("isUploadKind", () => {
  it("is true only for file and image", () => {
    expect(isUploadKind("file")).toBe(true);
    expect(isUploadKind("image")).toBe(true);
    expect(isUploadKind("snippet")).toBe(false);
  });
});

describe("validateUpload", () => {
  it("accepts allowed images and files", () => {
    expect(validateUpload("image", { name: "a.png", type: "image/png", size: MB })).toBeNull();
    expect(validateUpload("image", { name: "a.svg", type: "image/svg+xml", size: 10 })).toBeNull();
    expect(validateUpload("file", { name: "a.pdf", type: "application/pdf", size: MB })).toBeNull();
    expect(validateUpload("file", { name: "a.yml", type: "text/yaml", size: 10 })).toBeNull();
  });

  it("accepts text files the browser reports without a type", () => {
    expect(validateUpload("file", { name: "notes.md", type: "", size: 10 })).toBeNull();
    expect(
      validateUpload("file", { name: "c.toml", type: "application/octet-stream", size: 10 }),
    ).toBeNull();
  });

  it("rejects extensions not allowed for the kind", () => {
    expect(validateUpload("image", { name: "a.pdf", type: "application/pdf", size: 10 })).toMatch(
      /^Images must be one of/,
    );
    expect(validateUpload("file", { name: "a.exe", type: "", size: 10 })).toMatch(
      /^Files must be one of/,
    );
  });

  it("rejects a MIME type that doesn't match the kind", () => {
    expect(validateUpload("image", { name: "a.png", type: "text/html", size: 10 })).toBe(
      "This file type isn't allowed",
    );
    expect(validateUpload("image", { name: "a.png", type: "", size: 10 })).toBe(
      "This file type isn't allowed",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateUpload("file", { name: "a.txt", type: "text/plain", size: 0 })).toBe(
      "This file is empty",
    );
    expect(validateUpload("image", { name: "a.png", type: "image/png", size: 5 * MB + 1 })).toBe(
      "Images can be at most 5.0 MB",
    );
    expect(validateUpload("file", { name: "a.pdf", type: "application/pdf", size: 10 * MB })).toBeNull();
    expect(
      validateUpload("file", { name: "a.pdf", type: "application/pdf", size: 10 * MB + 1 }),
    ).toBe("Files can be at most 10.0 MB");
  });
});

describe("UPLOAD_CONSTRAINTS", () => {
  it("matches the spec's extensions and size limits", () => {
    expect(Object.keys(UPLOAD_CONSTRAINTS.image.extensions)).toEqual([
      ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ]);
    expect(Object.keys(UPLOAD_CONSTRAINTS.file.extensions)).toEqual([
      ".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini",
    ]);
    expect(UPLOAD_CONSTRAINTS.image.maxSize).toBe(5 * MB);
    expect(UPLOAD_CONSTRAINTS.file.maxSize).toBe(10 * MB);
  });

  it("accepts every allowed extension with the type it is stored as", () => {
    for (const kind of ["image", "file"] as const) {
      for (const [extension, type] of Object.entries(UPLOAD_CONSTRAINTS[kind].extensions)) {
        expect(validateUpload(kind, { name: `a${extension}`, type, size: 1 })).toBeNull();
      }
    }
  });
});

describe("getStoredContentType", () => {
  it("picks the type by extension", () => {
    expect(getStoredContentType("image", "a.JPG")).toBe("image/jpeg");
    expect(getStoredContentType("file", "settings.ini")).toBe("text/plain");
  });
});

describe("getAcceptAttribute", () => {
  it("lists the kind's extensions", () => {
    expect(getAcceptAttribute("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(3.5 * MB)).toBe("3.5 MB");
  });
});
