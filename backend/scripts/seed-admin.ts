import { connectDatabase, disconnectDatabase } from "../src/config/db";
import { User } from "../src/models/User";
import { Role } from "../src/types";
import { env } from "../src/config/env";
import { logger } from "../src/utils/logger";

async function seedAdmin(): Promise<void> {
  const { firstName, lastName, email, password, phone } = env.superAdmin;

  if (!firstName || !lastName || !email || !password || !phone) {
    throw new Error(
      "Missing SUPER_ADMIN_* environment variables. Set SUPER_ADMIN_FIRST_NAME, " +
        "SUPER_ADMIN_LAST_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_PHONE in .env"
    );
  }

  await connectDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role !== Role.SUPER_ADMIN) {
      existing.role = Role.SUPER_ADMIN;
      await existing.save();
      logger.info(`Existing user ${email} promoted to SUPER_ADMIN`);
    } else {
      logger.info(`Super admin ${email} already exists. No changes made.`);
    }
    await disconnectDatabase();
    return;
  }

  await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    password,
    role: Role.SUPER_ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

  logger.info(`Super admin account created for ${email}`);

  await disconnectDatabase();
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Failed to seed super admin", err);
    process.exit(1);
  });
