import { File, FileBraces, FileCode, FileSpreadsheet, FileText } from "lucide-react";
import { describe, expect, it } from "vitest";

import { getFileIcon } from "@/lib/file-icons";
import { UPLOAD_CONSTRAINTS } from "@/lib/file-upload";

describe("getFileIcon", () => {
  it("groups extensions by kind, ignoring case", () => {
    expect(getFileIcon("report.PDF")).toBe(FileText);
    expect(getFileIcon("notes.md")).toBe(FileText);
    expect(getFileIcon("package.json")).toBe(FileBraces);
    expect(getFileIcon("config.yml")).toBe(FileCode);
    expect(getFileIcon("data.csv")).toBe(FileSpreadsheet);
  });

  it("falls back to File for unknown, missing or empty names", () => {
    expect(getFileIcon("archive.zip")).toBe(File);
    expect(getFileIcon("README")).toBe(File);
    expect(getFileIcon(null)).toBe(File);
    expect(getFileIcon("")).toBe(File);
  });

  it("has a specific icon for every extension files can be uploaded with", () => {
    for (const extension of Object.keys(UPLOAD_CONSTRAINTS.file.extensions)) {
      expect(getFileIcon(`file${extension}`), extension).not.toBe(File);
    }
  });
});
