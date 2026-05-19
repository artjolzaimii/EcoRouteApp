import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PinCategory } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";

const router = Router();

const PinsQuerySchema = z.object({
  min_lat: z.coerce.number().min(-90).max(90),
  max_lat: z.coerce.number().min(-90).max(90),
  min_lng: z.coerce.number().min(-180).max(180),
  max_lng: z.coerce.number().min(-180).max(180),
});

const CreatePinSchema = z.object({
  category: z.nativeEnum(PinCategory),
  title: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  expiresInHours: z.number().int().min(1).max(720),
});

// ─── GET /api/pins ────────────────────────────────────────────────────────────

router.get(
  "/",
  validateQuery(PinsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { min_lat, max_lat, min_lng, max_lng } =
        req.query as unknown as z.infer<typeof PinsQuerySchema>;

      const now = new Date();
      const pins = await prisma.mapPin.findMany({
        where: {
          expiresAt: { gt: now },
          latitude: { gte: min_lat, lte: max_lat },
          longitude: { gte: min_lng, lte: max_lng },
        },
        include: { _count: { select: { upvotes: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const data = pins.map((pin) => ({
        id: pin.id,
        profileId: pin.profileId,
        category: pin.category,
        title: pin.title,
        description: pin.description,
        latitude: Number(pin.latitude),
        longitude: Number(pin.longitude),
        expiresAt: pin.expiresAt.toISOString(),
        createdAt: pin.createdAt.toISOString(),
        upvoteCount: pin._count.upvotes,
      }));

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/pins ───────────────────────────────────────────────────────────

router.post(
  "/",
  requireAuth,
  validateBody(CreatePinSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof CreatePinSchema>;
      const profileId = req.user!.profileId;

      const expiresAt = new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000);

      const pin = await prisma.mapPin.create({
        data: {
          profileId,
          category: body.category,
          title: body.title,
          description: body.description ?? null,
          latitude: body.latitude,
          longitude: body.longitude,
          expiresAt,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: pin.id,
          profileId: pin.profileId,
          category: pin.category,
          title: pin.title,
          description: pin.description,
          latitude: Number(pin.latitude),
          longitude: Number(pin.longitude),
          expiresAt: pin.expiresAt.toISOString(),
          createdAt: pin.createdAt.toISOString(),
          upvoteCount: 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/pins/:id ─────────────────────────────────────────────────────

router.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;

      const pin = await prisma.mapPin.findUnique({
        where: { id },
        select: { profileId: true },
      });

      if (!pin) {
        res.status(404).json({ success: false, error: "Pin not found" });
        return;
      }

      if (pin.profileId !== profileId) {
        res.status(403).json({ success: false, error: "Cannot delete another user's pin" });
        return;
      }

      await prisma.mapPin.delete({ where: { id } });
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/pins/:id/upvote ────────────────────────────────────────────────

router.post(
  "/:id/upvote",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;

      const existing = await prisma.pinUpvote.findUnique({
        where: { pinId_profileId: { pinId: id, profileId } },
      });

      if (existing) {
        await prisma.pinUpvote.delete({
          where: { pinId_profileId: { pinId: id, profileId } },
        });
      } else {
        await prisma.pinUpvote.create({ data: { pinId: id, profileId } });
      }

      const upvoteCount = await prisma.pinUpvote.count({ where: { pinId: id } });

      res.json({ success: true, data: { upvoteCount, hasUpvoted: !existing } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/pins/:id/comments ──────────────────────────────────────────────

router.get(
  "/:id/comments",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

      const comments = await prisma.pinComment.findMany({
        where: { pinId: id },
        include: { profile: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
        take: 50,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      res.json({
        success: true,
        data: comments.map((c) => ({
          id: c.id,
          pinId: c.pinId,
          profileId: c.profileId,
          authorName: c.profile.fullName,
          text: c.text,
          createdAt: c.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/pins/:id/comments ─────────────────────────────────────────────

const CreateCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

router.post(
  "/:id/comments",
  requireAuth,
  validateBody(CreateCommentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;
      const { text } = req.body as z.infer<typeof CreateCommentSchema>;

      const pin = await prisma.mapPin.findUnique({ where: { id }, select: { id: true } });
      if (!pin) {
        res.status(404).json({ success: false, error: "Pin not found" });
        return;
      }

      const comment = await prisma.pinComment.create({
        data: { pinId: id, profileId, text },
        include: { profile: { select: { fullName: true } } },
      });

      res.status(201).json({
        success: true,
        data: {
          id: comment.id,
          pinId: comment.pinId,
          profileId: comment.profileId,
          authorName: comment.profile.fullName,
          text: comment.text,
          createdAt: comment.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
