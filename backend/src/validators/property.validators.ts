import { z } from "zod";
import { Types } from "mongoose";
import { somaliPhoneSchema } from "./auth.validators";
import { SOMALI_CITIES } from "../utils/somaliCities";
import { SOMALI_CARRIERS } from "../utils/somaliPhone";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

// Multipart form fields arrive as strings. z.coerce.number() would turn a
// blank field into 0, so blanks are treated as missing before converting.
function formNumber(schema: z.ZodNumber) {
  return z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val === undefined ? val : Number(val)),
    schema
  );
}

const requiredNumber = z.number({ required_error: "Required", invalid_type_error: "Must be a number" });

export const createPropertySchema = z.object({
  body: z.object({
    city: z.enum(SOMALI_CITIES, { errorMap: () => ({ message: "Please choose a city from the list" }) }),
    neighborhood: z.string().trim().min(2).max(80),
    description: z.string().trim().min(20, "Please describe the property in a bit more detail").max(2000),
    phone: somaliPhoneSchema,
    rooms: formNumber(requiredNumber.int().min(0).max(50)),
    bathrooms: formNumber(requiredNumber.int().min(0).max(50)),
    price: formNumber(requiredNumber.min(0).max(1_000_000)),
    deposit: formNumber(requiredNumber.min(0).max(1_000_000)),
  }),
});

export const listPropertiesQuerySchema = z.object({
  query: z.object({
    city: z.string().trim().max(80).optional(),
    neighborhood: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRooms: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

const PHONE_PROVIDERS = [...new Set(Object.values(SOMALI_CARRIERS))] as [string, ...string[]];

// Admin-only filters on top of the public ones.
const adminFilters = {
  // Matches the poster's name, email or phone, or the listing's phone.
  q: z.string().trim().max(100).optional(),
  // Mobile network of the poster's or the listing's phone number.
  provider: z.enum(PHONE_PROVIDERS).optional(),
};

export const adminListPropertiesQuerySchema = z.object({
  query: listPropertiesQuerySchema.shape.query.extend(adminFilters),
});

export const exportPropertiesQuerySchema = z.object({
  query: listPropertiesQuerySchema.shape.query.omit({ page: true, limit: true }).extend(adminFilters),
});

export const propertyIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>["body"];
