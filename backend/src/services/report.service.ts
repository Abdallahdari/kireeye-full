import { Report, IReport } from "../models/Report";
import { User } from "../models/User";
import { Property } from "../models/Property";
import { AppError } from "../utils/AppError";
import { ReportStatus } from "../types";
import { CreateReportInput } from "../validators/report.validators";

const POPULATE_FIELDS = "firstName lastName email role";
const PROPERTY_POPULATE_FIELDS = "city neighborhood images";

const POPULATE_PATHS = [
  { path: "reporter", select: POPULATE_FIELDS },
  { path: "reportedUser", select: POPULATE_FIELDS },
  { path: "property", select: PROPERTY_POPULATE_FIELDS },
];

async function resolveReportTarget(reporterId: string, input: CreateReportInput) {
  if (input.propertyId) {
    const property = await Property.findById(input.propertyId);
    if (!property) {
      throw new AppError("Listing not found", 404);
    }
    if (property.owner.toString() === reporterId) {
      throw new AppError("You cannot report your own listing", 400);
    }

    const alreadyOpen = await Report.exists({
      reporter: reporterId,
      property: property._id,
      status: ReportStatus.OPEN,
    });
    if (alreadyOpen) {
      throw new AppError("You've already reported this listing. Our team is reviewing it.", 409);
    }

    return { reportedUser: property.owner, property: property._id };
  }

  const reportedUser = await User.findOne({ email: input.reportedEmail!.toLowerCase() });
  if (!reportedUser) {
    throw new AppError("No account found with that email", 404);
  }
  if (reportedUser._id.toString() === reporterId) {
    throw new AppError("You cannot report yourself", 400);
  }

  return { reportedUser: reportedUser._id, property: null };
}

export async function createReport(reporterId: string, input: CreateReportInput): Promise<IReport> {
  const target = await resolveReportTarget(reporterId, input);

  const report = await Report.create({
    reporter: reporterId,
    ...target,
    reason: input.reason,
    details: input.details,
  });

  return report.populate(POPULATE_PATHS);
}

interface ListReportsOptions {
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export async function listReports(options: ListReportsOptions) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const filter = options.status ? { status: options.status } : {};

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE_PATHS),
    Report.countDocuments(filter),
  ]);

  return { reports, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<IReport> {
  const report = await Report.findById(id);
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  report.status = status;
  await report.save();

  return report.populate(POPULATE_PATHS);
}
