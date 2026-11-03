// The uploaded object, as the New Item dialog sends it to createItem.
export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export type UploadResponse =
  | { success: true; data: UploadedFile }
  | { success: false; error: string };

export type DeleteUploadResponse = { success: true } | { success: false; error: string };
