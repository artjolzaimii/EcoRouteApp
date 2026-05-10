import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/notifications
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { profileId: req.user!.profileId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/notifications/read-all
router.patch(
  "/read-all",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: { profileId: req.user!.profileId, isRead: false },
        data: { isRead: true },
      });
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const notif = await prisma.notification.findUnique({
        where: { id },
      });
      if (!notif || notif.profileId !== req.user!.profileId) {
        res.status(404).json({ success: false, error: "Not found" });
        return;
      }
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
