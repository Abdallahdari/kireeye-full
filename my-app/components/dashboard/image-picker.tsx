"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MAX_ORIGINAL_IMAGE_BYTES, MAX_UPLOAD_IMAGE_BYTES, resizeImage } from "@/lib/resize-image";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Picks one image and previews it. Shows `currentUrl` (the saved image) until
 * a new file is chosen. `onRemove` adds a remove button when there's an image.
 */
export function ImagePicker({
  label,
  hint,
  chooseLabel,
  removeLabel,
  currentUrl,
  file,
  onFileChange,
  onRemove,
  onInvalid,
  aspectClass = "aspect-[16/9]",
}: {
  label: string;
  hint?: string;
  chooseLabel: string;
  removeLabel?: string;
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  onInvalid: () => void;
  aspectClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Preview of the picked file; the file only ever changes through this component.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Release the last preview URL when the form unmounts.
  const previewRef = useRef(previewUrl);
  useEffect(() => {
    previewRef.current = previewUrl;
  }, [previewUrl]);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function select(next: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
    onFileChange(next);
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (!ACCEPTED_TYPES.includes(picked.type) || picked.size > MAX_ORIGINAL_IMAGE_BYTES) {
      onInvalid();
      return;
    }
    // Shrink to web size before upload (see lib/resize-image.ts).
    const resized = await resizeImage(picked).catch(() => picked);
    if (resized.size > MAX_UPLOAD_IMAGE_BYTES) {
      onInvalid();
      return;
    }
    select(resized);
  }

  const shown = (file && previewUrl) || currentUrl || null;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {shown ? (
        <div className={`group relative w-full max-w-md overflow-hidden rounded-xl bg-zinc-100 ${aspectClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview or our own /api upload */}
          <img src={shown} alt="" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-800 shadow hover:bg-white"
            >
              {chooseLabel}
            </button>
            {(file || onRemove) && (
              <button
                type="button"
                onClick={() => (file ? select(null) : onRemove?.())}
                aria-label={removeLabel}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full max-w-md flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 ${aspectClass}`}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-medium">{chooseLabel}</span>
        </button>
      )}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} hidden onChange={handleChange} />
    </div>
  );
}
