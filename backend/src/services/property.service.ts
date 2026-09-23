import ExcelJS from "exceljs";
import { FilterQuery } from "mongoose";
import { Property, IProperty, MAX_PROPERTY_IMAGES } from "../models/Property";
import { User, IUser } from "../models/User";
import { AppError } from "../utils/AppError";
import { Role } from "../types";
import { CreatePropertyInput } from "../validators/property.validators";
import { deletePropertyImages, propertyImageUrl } from "../middleware/upload";
import { SOMALI_CARRIERS, normalizeSomaliPhone } from "../utils/somaliPhone";
import { escapeRegex, nationalDigits } from "../utils/search";
import { reserveListingSlot, releaseListingSlot, syncListingVisibility } from "./billing.service";
import { styleHeaderRow, USD_FORMAT, DATE_TIME_FORMAT } from "../utils/excel";

// The public site shows who posted a listing and how to reach them; admins
// also see the account email, city and role.
export const PUBLIC_OWNER_FIELDS = "firstName lastName phone";
export const ADMIN_OWNER_FIELDS = "firstName lastName email phone city role isActive";

export async function createProperty(
  ownerId: string,
  input: CreatePropertyInput,
  files: Express.Multer.File[]
): Promise<IProperty> {
  if (files.length === 0) {
    throw new AppError("Please add at least one image", 400);
  }
  if (files.length > MAX_PROPERTY_IMAGES) {
    throw new AppError(`You can upload up to ${MAX_PROPERTY_IMAGES} images`, 400);
  }

  // Counts against the free allowance / requires a subscription (402 if not).
  await reserveListingSlot(ownerId);

  let property: IProperty;
  try {
    property = await Property.create({
      owner: ownerId,
      ...input,
      images: files.map((f) => propertyImageUrl(f.filename)),
    });
  } catch (err) {
    await releaseListingSlot(ownerId);
    throw err;
  }

  await syncListingVisibility(ownerId);
  return property.populate("owner", PUBLIC_OWNER_FIELDS);
}

export interface PropertyFilterOptions {
  ownerId?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  // Admin only: free-text search over poster name/email/phone and listing phone.
  q?: string;
  // Admin only: mobile network (e.g. "Hormuud") of the poster's or listing's phone.
  provider?: string;
  // Public site: hide listings from suspended accounts and listings hidden
  // for unpaid billing.
  excludeSuspendedOwners?: boolean;
}

interface ListPropertiesOptions extends PropertyFilterOptions {
  page?: number;
  limit?: number;
  ownerFields: string;
}

async function buildPropertyFilter(options: PropertyFilterOptions): Promise<FilterQuery<IProperty>> {
  const conditions: FilterQuery<IProperty>[] = [];

  if (options.ownerId) {
    conditions.push({ owner: options.ownerId });
  } else if (options.excludeSuspendedOwners) {
    const suspendedIds = await User.find({ isActive: false }).distinct("_id");
    if (suspendedIds.length > 0) conditions.push({ owner: { $nin: suspendedIds } });
    conditions.push({ billingHidden: { $ne: true } });
  }

  if (options.city) {
    conditions.push({ city: new RegExp(`^${escapeRegex(options.city)}$`, "i") });
  }
  if (options.neighborhood) {
    conditions.push({ neighborhood: new RegExp(escapeRegex(options.neighborhood), "i") });
  }
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    conditions.push({
      price: {
        ...(options.minPrice !== undefined && { $gte: options.minPrice }),
        ...(options.maxPrice !== undefined && { $lte: options.maxPrice }),
      },
    });
  }
  if (options.minRooms !== undefined) {
    conditions.push({ rooms: { $gte: options.minRooms } });
  }

  if (options.q) {
    // Every word must match somewhere on the poster (so "amina farah" works),
    // or the whole query matches the listing's contact phone.
    const tokens = options.q.split(/\s+/).filter(Boolean).slice(0, 5);
    const ownerIds = await User.find({
      $and: tokens.map((token) => {
        const re = new RegExp(escapeRegex(token), "i");
        const or: FilterQuery<IUser>[] = [{ firstName: re }, { lastName: re }, { email: re }];
        const digits = nationalDigits(token);
        if (digits.length >= 3) or.push({ phone: new RegExp(escapeRegex(digits)) });
        return { $or: or };
      }),
    }).distinct("_id");

    const or: FilterQuery<IProperty>[] = [{ owner: { $in: ownerIds } }];
    const digits = nationalDigits(options.q);
    if (digits.length >= 3) or.push({ phone: new RegExp(escapeRegex(digits)) });
    conditions.push({ $or: or });
  }

  if (options.provider) {
    const prefixes = Object.entries(SOMALI_CARRIERS)
      .filter(([, name]) => name === options.provider)
      .map(([prefix]) => prefix);
    const re = new RegExp(`^\\+252(${prefixes.join("|")})`);
    const ownerIds = await User.find({ phone: re }).distinct("_id");
    conditions.push({ $or: [{ phone: re }, { owner: { $in: ownerIds } }] });
  }

  return conditions.length > 0 ? { $and: conditions } : {};
}

export async function listProperties(options: ListPropertiesOptions) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const filter = await buildPropertyFilter(options);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("owner", options.ownerFields),
    Property.countDocuments(filter),
  ]);

  return { properties, total, page, limit, pages: Math.ceil(total / limit) };
}

const MAX_EXPORT_ROWS = 10_000;

/** Builds an .xlsx of listings (with poster details) matching the admin filters. */
export async function exportPropertiesWorkbook(options: PropertyFilterOptions): Promise<ExcelJS.Workbook> {
  const filter = await buildPropertyFilter(options);
  const properties = await Property.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_EXPORT_ROWS)
    .populate<{ owner: IUser | null }>("owner", ADMIN_OWNER_FIELDS)
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Stayly";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Listings", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Owner name", key: "ownerName", width: 24 },
    { header: "Owner phone", key: "ownerPhone", width: 16 },
    { header: "Owner network", key: "ownerProvider", width: 14 },
    { header: "Owner email", key: "ownerEmail", width: 28 },
    { header: "Owner city", key: "ownerCity", width: 14 },
    { header: "Account status", key: "ownerStatus", width: 14 },
    { header: "Listing city", key: "city", width: 14 },
    { header: "Neighborhood", key: "neighborhood", width: 18 },
    { header: "Contact phone", key: "phone", width: 16 },
    { header: "Contact network", key: "provider", width: 15 },
    { header: "Rooms", key: "rooms", width: 8 },
    { header: "Bathrooms", key: "bathrooms", width: 10 },
    { header: "Monthly rent (USD)", key: "price", width: 18, style: { numFmt: USD_FORMAT } },
    { header: "Deposit (USD)", key: "deposit", width: 15, style: { numFmt: USD_FORMAT } },
    { header: "Images", key: "images", width: 8 },
    { header: "Posted", key: "createdAt", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Description", key: "description", width: 60 },
    { header: "Listing ID", key: "id", width: 26 },
  ];

  for (const p of properties) {
    const owner = p.owner;
    sheet.addRow({
      ownerName: owner ? `${owner.firstName} ${owner.lastName}` : "(deleted account)",
      ownerPhone: owner?.phone ?? "",
      ownerProvider: owner ? (normalizeSomaliPhone(owner.phone)?.provider ?? "") : "",
      ownerEmail: owner?.email ?? "",
      ownerCity: owner?.city ?? "",
      ownerStatus: owner ? (owner.isActive ? "Active" : "Suspended") : "",
      city: p.city,
      neighborhood: p.neighborhood,
      phone: p.phone,
      provider: normalizeSomaliPhone(p.phone)?.provider ?? "",
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      price: p.price,
      deposit: p.deposit,
      images: p.images.length,
      createdAt: p.createdAt,
      description: p.description,
      id: p._id.toString(),
    });
  }

  styleHeaderRow(sheet);

  return workbook;
}

/** A single listing for the public site; hidden if its owner is suspended. */
export async function getPublicProperty(id: string): Promise<IProperty> {
  const property = await Property.findById(id).populate<{ owner: IUser | null }>("owner", `${PUBLIC_OWNER_FIELDS} isActive`);
  if (!property || property.billingHidden || !property.owner || !property.owner.isActive) {
    throw new AppError("Listing not found", 404);
  }

  // isActive was only needed for the check above.
  const json = property.toJSON() as unknown as { owner: Record<string, unknown> };
  delete json.owner.isActive;
  return json as unknown as IProperty;
}

/** Owners can delete their own listings; SUPER_ADMIN can delete any. */
export async function deleteProperty(id: string, actor: IUser): Promise<IProperty> {
  const property = await Property.findById(id);
  if (!property) {
    throw new AppError("Listing not found", 404);
  }

  const isOwner = property.owner.toString() === actor._id.toString();
  if (!isOwner && actor.role !== Role.SUPER_ADMIN) {
    throw new AppError("You do not have permission to delete this listing", 403);
  }

  await property.deleteOne();
  await deletePropertyImages(property.images);
  // A hidden listing may now fit within the free allowance.
  await syncListingVisibility(property.owner);

  return property;
}
