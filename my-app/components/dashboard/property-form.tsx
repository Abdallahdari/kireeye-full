"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Field } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { SOMALI_NATIONAL_NUMBER_LENGTH, toSomaliNationalDigits } from "@/lib/somali-phone";
import { MOGADISHU_DISTRICTS, isSomaliCity } from "@/lib/locations";
import { CitySelect } from "@/components/ui/city-select";
import { MAX_ORIGINAL_IMAGE_BYTES, MAX_UPLOAD_IMAGE_BYTES, resizeImage } from "@/lib/resize-image";
import type { Property } from "@/lib/types";

// Kept in sync with backend/src/models/Property.ts.
const MAX_IMAGES = 4;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const textareaClass =
  "rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

interface SelectedImage {
  file: File;
  previewUrl: string;
}

export function PropertyForm({ onCreated, onCancel }: { onCreated: (property: Property) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to the business's own city from registration.
  const [city, setCity] = useState<string>(() => (isSomaliCity(user?.city) ? user.city : "Mogadishu"));
  const [neighborhood, setNeighborhood] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(() => (user ? toSomaliNationalDigits(user.phone) : ""));
  const [rooms, setRooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);

  // Release preview object URLs when images are removed or the form unmounts.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl)), []);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError(null);

    const room = MAX_IMAGES - images.length;
    if (picked.length > room) {
      setError(t("listings.form.errorTooManyImages", { max: MAX_IMAGES }));
    }

    // Photos are shrunk to web size before upload (see lib/resize-image.ts).
    setProcessingImages(true);
    const valid: SelectedImage[] = [];
    for (const original of picked.slice(0, room)) {
      if (!ACCEPTED_TYPES.includes(original.type)) {
        setError(t("listings.form.errorImageType"));
        continue;
      }
      if (original.size > MAX_ORIGINAL_IMAGE_BYTES) {
        setError(t("listings.form.errorImageSize"));
        continue;
      }
      const file = await resizeImage(original).catch(() => original);
      if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        setError(t("listings.form.errorImageSize"));
        continue;
      }
      valid.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setProcessingImages(false);

    setImages((prev) => [...prev, ...valid].slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError(t("listings.form.errorNoImages"));
      return;
    }
    if (phone.length !== SOMALI_NATIONAL_NUMBER_LENGTH) {
      setError(t("listings.form.errorPhone"));
      return;
    }

    setLoading(true);
    try {
      const { property } = await api.createProperty({
        city,
        neighborhood,
        description,
        phone: `+252${phone}`,
        rooms: Number(rooms),
        bathrooms: Number(bathrooms),
        price: Number(price),
        deposit: Number(deposit),
        images: images.map((img) => img.file),
      });
      onCreated(property);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("listings.form.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <CitySelect
          label={t("listings.form.city")}
          placeholder={t("auth.register.cityPlaceholder")}
          required
          value={city}
          onChange={setCity}
        />
        <Field
          label={t("listings.form.neighborhood")}
          name="neighborhood"
          required
          minLength={2}
          maxLength={80}
          list="mogadishu-districts"
          placeholder="Hodan"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        />
        <datalist id="mogadishu-districts">
          {MOGADISHU_DISTRICTS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <Field
          label={t("listings.form.rooms")}
          name="rooms"
          type="number"
          required
          min={0}
          max={50}
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
        />
        <Field
          label={t("listings.form.bathrooms")}
          name="bathrooms"
          type="number"
          required
          min={0}
          max={50}
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
        />
        <Field
          label={t("listings.form.price")}
          name="price"
          type="number"
          inputMode="decimal"
          required
          min={0}
          max={1000000}
          step="any"
          placeholder="300"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Field
          label={t("listings.form.deposit")}
          name="deposit"
          type="number"
          inputMode="decimal"
          required
          min={0}
          max={1000000}
          step="any"
          placeholder="300"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
        />
      </div>

      <PhoneField label={t("listings.form.phone")} value={phone} onChange={setPhone} required />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">{t("listings.form.description")}</span>
        <textarea
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder={t("listings.form.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaClass}
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">
          {t("listings.form.images")}{" "}
          <span className="font-normal text-zinc-400">
            ({images.length}/{MAX_IMAGES})
          </span>
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview */}
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {t("listings.form.cover")}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={t("listings.form.removeImage")}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              disabled={processingImages}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">{t("listings.form.addImages")}</span>
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-500">{t("listings.form.imagesHint", { max: MAX_IMAGES })}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          hidden
          onChange={handleFilesSelected}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          {t("listings.form.cancel")}
        </Button>
        <Button type="submit" loading={loading} disabled={processingImages}>
          {t("listings.form.submit")}
        </Button>
      </div>
    </form>
  );
}
