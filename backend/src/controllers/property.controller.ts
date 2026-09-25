import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as propertyService from "../services/property.service";
import { recordAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../types";
import { CreatePropertyInput } from "../validators/property.validators";

type ListQuery = {
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  q?: string;
  provider?: string;
  page?: number;
  limit?: number;
};

function sendList(res: Response, result: Awaited<ReturnType<typeof propertyService.listProperties>>) {
  res.status(200).json({
    success: true,
    data: {
      properties: result.properties,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    },
  });
}

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const files = Array.isArray(req.files) ? req.files : [];
  const property = await propertyService.createProperty(
    req.user._id.toString(),
    req.body as CreatePropertyInput,
    files
  );

  await recordAuditLog({
    actor: req.user._id,
    action: AuditAction.PROPERTY_CREATED,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { propertyId: property._id.toString() },
  });

  res.status(201).json({ success: true, message: "Listing published", data: { property } });
});

export const listPublicProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertyService.listProperties({
    ...(req.query as ListQuery),
    ownerFields: propertyService.PUBLIC_OWNER_FIELDS,
    excludeSuspendedOwners: true,
  });
  sendList(res, result);
});

export const listMyProperties = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { page, limit } = req.query as ListQuery;
  const result = await propertyService.listProperties({
    ownerId: req.user._id.toString(),
    page,
    limit,
    ownerFields: propertyService.PUBLIC_OWNER_FIELDS,
  });
  sendList(res, result);
});

export const listAllProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertyService.listProperties({
    ...(req.query as ListQuery),
    ownerFields: propertyService.ADMIN_OWNER_FIELDS,
  });
  sendList(res, result);
});

export const exportProperties = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const filters = req.query as ListQuery;
  const workbook = await propertyService.exportPropertiesWorkbook(filters);
  const rowCount = workbook.getWorksheet("Listings")?.actualRowCount ?? 1;

  // Exports contain people's contact details, so record who downloaded what.
  await recordAuditLog({
    actor: req.user._id,
    action: AuditAction.PROPERTIES_EXPORTED,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { filters, rows: rowCount - 1 },
  });

  const filename = `kireeye-listings-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  await workbook.xlsx.write(res);
  res.end();
});

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.getPublicProperty(req.params.id);
  res.status(200).json({ success: true, data: { property } });
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const property = await propertyService.deleteProperty(req.params.id, req.user);

  await recordAuditLog({
    actor: req.user._id,
    action: AuditAction.PROPERTY_DELETED,
    targetUser: property.owner,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { propertyId: property._id.toString() },
  });

  res.status(200).json({ success: true, message: "Listing deleted" });
});
