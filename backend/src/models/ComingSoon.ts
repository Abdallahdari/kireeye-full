import { Schema, model, Document, Types } from "mongoose";

// A slide in the home page hero's "Coming soon" slider, managed by admins.
export interface IComingSoon extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  // Optional short location label, e.g. "Hodan, Mogadishu".
  location: string;
  // Optional link for a call-to-action button (internal path or https URL).
  link: string;
  // Public URL of the uploaded image — see middleware/upload.ts.
  image: string;
  isActive: boolean;
  // Lower numbers show first.
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const comingSoonSchema = new Schema<IComingSoon>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    location: { type: String, trim: true, maxlength: 80, default: "" },
    link: { type: String, trim: true, maxlength: 300, default: "" },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

comingSoonSchema.index({ order: 1, createdAt: -1 });

export const ComingSoon = model<IComingSoon>("ComingSoon", comingSoonSchema);
