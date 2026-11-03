"use client";

import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  getAcceptAttribute,
  UPLOAD_CONSTRAINTS,
  validateUpload,
  type UploadKind,
} from "@/lib/file-upload";
import { cn } from "@/lib/utils";
import type { UploadedFile, UploadResponse } from "@/types/uploads";

const UPLOAD_FAILED = "Upload failed. Check your connection and try again.";

// Best effort: removes an upload that won't become an item. keepalive lets it finish
// even when the dialog or page is closing.
export function discardUpload(fileUrl: string) {
  fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
    keepalive: true,
  }).catch(() => {});
}

interface FileUploadProps {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
  errors?: string[];
}

export function FileUpload({
  kind,
  value,
  onChange,
  onUploadingChange,
  disabled = false,
  errors,
}: FileUploadProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const request = useRef<XMLHttpRequest | null>(null);

  // Stop an upload still running when the dialog closes.
  useEffect(() => () => request.current?.abort(), []);

  const error = localError ?? errors?.[0];
  const uploading = progress !== null;

  function finish(result: UploadedFile | null, message: string | null = null) {
    request.current = null;
    setProgress(null);
    setLocalError(message);
    onUploadingChange(false);
    if (result) onChange(result);
  }

  function upload(file: File) {
    const invalid = validateUpload(kind, file);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    // A new file replaces the current upload.
    if (value) {
      discardUpload(value.fileUrl);
      onChange(null);
    }

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    // XMLHttpRequest rather than fetch, which can't report upload progress.
    const xhr = new XMLHttpRequest();
    request.current = xhr;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: UploadResponse | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (body?.success) finish(body.data);
      else finish(null, body?.error ?? UPLOAD_FAILED);
    };
    xhr.onerror = () => finish(null, UPLOAD_FAILED);
    xhr.open("POST", "/api/upload");
    xhr.send(formData);

    setUploadingName(file.name);
    setProgress(0);
    setLocalError(null);
    onUploadingChange(true);
  }

  function remove() {
    if (value) discardUpload(value.fileUrl);
    onChange(null);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled && !uploading) upload(file);
  }

  const label = kind === "image" ? "Image" : "File";
  const { maxSize, extensions } = UPLOAD_CONSTRAINTS[kind];

  return (
    // A minmax(0, 1fr) column so a long file name truncates instead of widening the dialog.
    <div className="grid grid-cols-1 gap-2">
      <label htmlFor={inputId} className="text-sm leading-none font-medium select-none">
        {label}
      </label>

      {value && !uploading ? (
        <UploadedFilePreview kind={kind} file={value} onRemove={remove} disabled={disabled} />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled && !uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            dragging ? "border-primary bg-primary/5" : "border-input",
            error && "border-destructive",
            (disabled || uploading) && "opacity-60",
          )}
        >
          {uploading ? (
            <UploadProgress name={uploadingName} progress={progress} />
          ) : (
            <>
              <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm">
                <span className="font-medium">Drop a file here</span> or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.keys(extensions).join(", ")} · up to {formatFileSize(maxSize)}
              </p>
            </>
          )}
          {/* Covers the whole zone, so a click anywhere opens the picker. */}
          <input
            id={inputId}
            type="file"
            accept={getAcceptAttribute(kind)}
            disabled={disabled || uploading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Cleared so choosing the same file again still fires a change.
              event.target.value = "";
              if (file) upload(file);
            }}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadProgress({ name, progress }: { name: string; progress: number | null }) {
  return (
    <div className="flex w-full flex-col items-center gap-2" aria-live="polite">
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="max-w-full truncate text-sm">Uploading {name}</p>
      <progress
        value={progress ?? 0}
        max={100}
        aria-label={`Uploading ${name}`}
        className="h-1.5 w-full max-w-xs appearance-none overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-[width]"
      />
      <p className="text-xs text-muted-foreground tabular-nums">{progress ?? 0}%</p>
    </div>
  );
}

interface UploadedFilePreviewProps {
  kind: UploadKind;
  file: UploadedFile;
  onRemove: () => void;
  disabled: boolean;
}

function UploadedFilePreview({ kind, file, onRemove, disabled }: UploadedFilePreviewProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads on the R2 public domain
        <img
          src={file.fileUrl}
          alt=""
          className="size-14 shrink-0 rounded-md bg-muted object-contain"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileText className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.fileName}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.fileName}`}
      >
        <X />
      </Button>
    </div>
  );
}
