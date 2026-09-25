import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import reportRoutes from "./report.routes";
import propertyRoutes from "./property.routes";
import billingRoutes from "./billing.routes";
import contactRoutes from "./contact.routes";
import comingSoonRoutes from "./comingSoon.routes";
import blogRoutes from "./blog.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/properties", propertyRoutes);
router.use("/billing", billingRoutes);
router.use("/contact", contactRoutes);
router.use("/coming-soon", comingSoonRoutes);
router.use("/blog", blogRoutes);

export default router;
