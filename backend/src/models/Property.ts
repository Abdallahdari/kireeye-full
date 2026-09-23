import { Schema, model, Document, Types } from "mongoose";

export const MAX_PROPERTY_IMAGES = 8;

export interface IProperty extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  city: string;
  neighborhood: string;
  description: string;
  phone: string;
  rooms: number;
  bathrooms: number;
  // Both in US dollars: rent per month, and the one-off security deposit.
  price: number;
  deposit: number;
  // Public URLs (e.g. "/api/uploads/properties/<file>") of the images saved
  // to disk by the upload middleware — see middleware/upload.ts.
  images: string[];
  // True when the owner is over the free allowance without an active
  // subscription — hidden from the public site until they pay.
  billingHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    neighborhood: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    phone: { type: String, required: true, trim: true },
    rooms: { type: Number, required: true, min: 0, max: 50 },
    bathrooms: { type: Number, required: true, min: 0, max: 50 },
    price: { type: Number, required: true, min: 0, max: 1_000_000 },
    deposit: { type: Number, required: true, min: 0, max: 1_000_000 },
    images: {
      type: [String],
      validate: {
        validator: (val: string[]) => val.length >= 1 && val.length <= MAX_PROPERTY_IMAGES,
        message: `A listing needs between 1 and ${MAX_PROPERTY_IMAGES} images`,
      },
    },
    billingHidden: { type: Boolean, default: false, index: true },
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

propertySchema.index({ createdAt: -1 });
propertySchema.index({ price: 1 });

export const Property = model<IProperty>("Property", propertySchema);
