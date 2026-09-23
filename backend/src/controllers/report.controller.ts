import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as reportService from "../services/report.service";
import { ReportStatus } from "../types";
import { CreateReportInput } from "../validators/report.validators";

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const input = req.body as CreateReportInput;
  const report = await reportService.createReport(req.user._id.toString(), input);

  res.status(201).json({
    success: true,
    message: "Report submitted. Our team will review it.",
    data: { report },
  });
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as { status?: ReportStatus; page?: number; limit?: number };

  const result = await reportService.listReports({ status, page, limit });

  res.status(200).json({
    success: true,
    data: {
      reports: result.reports,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    },
  });
});

export const updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: ReportStatus };
  const report = await reportService.updateReportStatus(req.params.id, status);

  res.status(200).json({ success: true, message: "Report updated", data: { report } });
});
