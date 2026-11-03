import {
  File,
  FileBraces,
  FileCode,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { getFileExtension } from "@/lib/file-upload";

// Icons for the extensions file items can be uploaded with; anything else gets File.
const FILE_ICONS: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileText,
  ".md": FileText,
  ".json": FileBraces,
  ".xml": FileCode,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".toml": FileCode,
  ".ini": FileCode,
  ".csv": FileSpreadsheet,
};

export function getFileIcon(fileName: string | null): LucideIcon {
  return (fileName && FILE_ICONS[getFileExtension(fileName)]) || File;
}
