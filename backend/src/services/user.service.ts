import { User, IUser } from "../models/User";
import { AppError } from "../utils/AppError";
import { Role, BusinessApprovalStatus } from "../types";

interface ListUsersOptions {
  role?: Role;
  businessApproval?: BusinessApprovalStatus;
  page?: number;
  limit?: number;
}

export async function listUsers(options: ListUsersOptions) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const filter: Record<string, unknown> = {};
  if (options.role) filter.role = options.role;
  if (options.businessApproval) filter.businessApproval = options.businessApproval;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function updateUserStatus(
  id: string,
  isActive: boolean,
  actorId: string
): Promise<IUser> {
  if (id === actorId) {
    throw new AppError("You cannot change your own account status", 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = isActive;
  await user.save();
  return user;
}

export async function updateUserRole(
  id: string,
  role: Role,
  actorId: string
): Promise<IUser> {
  if (id === actorId) {
    throw new AppError("You cannot change your own role", 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.role = role;
  await user.save();
  return user;
}

export async function updateBusinessApproval(
  id: string,
  status: BusinessApprovalStatus,
  actorId: string
): Promise<IUser> {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== Role.BUSINESS) {
    throw new AppError("Only business accounts require approval", 400);
  }

  if (id === actorId) {
    throw new AppError("You cannot change your own approval status", 400);
  }

  user.businessApproval = status;
  await user.save();
  return user;
}
