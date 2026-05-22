import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import { prisma } from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import { requireAuth } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validate.middleware";
import { v4 as uuid } from "uuid";
import { cacheGet, cacheSet } from "../services/cache.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const ListQuerySchema = z.object({
  sort: z.enum(["comments", "likes", "newest"]).default("comments"),
  cursor: z.string().optional(),
});

// ─── GET /api/forums ──────────────────────────────────────────────────────────

router.get(
  "/",
  validateQuery(ListQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sort, cursor } = req.query as unknown as z.infer<typeof ListQuerySchema>;

      // Public forum listing — cache per sort+cursor page (2 min TTL)
      const cacheKey = `forum:list:${sort}:${cursor ?? "first"}`;
      const cached = await cacheGet<unknown[]>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      const orderBy =
        sort === "likes"   ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "newest" ? [{ createdAt: "desc" as const }]
        :                     [{ commentCount: "desc" as const }, { createdAt: "desc" as const }];

      const forums = await prisma.forum.findMany({
        orderBy,
        take: 20,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: { profile: { select: { fullName: true } } },
      });

      const payload = forums.map((f) => ({
        id: f.id,
        profileId: f.profileId,
        authorName: f.profile.fullName,
        title: f.title,
        body: f.body,
        imageUrl: f.imageUrl,
        likeCount: f.likeCount,
        commentCount: f.commentCount,
        createdAt: f.createdAt.toISOString(),
      }));

      await cacheSet(cacheKey, payload, 2 * 60); // 2 min TTL
      res.json({ success: true, data: payload });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/forums/by-pin/:pinId ───────────────────────────────────────────

router.get(
  "/by-pin/:pinId",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pinId = req.params.pinId as string;
      const forum = await prisma.forum.findFirst({
        where: { sourcePinId: pinId },
        select: { id: true },
      });
      if (!forum) {
        res.status(404).json({ success: false, data: null });
        return;
      }
      res.json({ success: true, data: { forumId: forum.id } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/forums ─────────────────────────────────────────────────────────

router.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, body, sourcePinId } = req.body as {
        title?: string;
        body?: string;
        sourcePinId?: string;
      };

      if (!title?.trim()) {
        res.status(400).json({ success: false, error: "Title is required" });
        return;
      }

      if (sourcePinId) {
        const existing = await prisma.forum.findFirst({
          where: { sourcePinId },
          select: { id: true },
        });
        if (existing) {
          res.status(409).json({ success: false, error: "A forum already exists for this pin", data: { forumId: existing.id } });
          return;
        }
      }

      const profileId = req.user!.profileId;
      let imageUrl: string | null = null;

      if (req.file) {
        const ext = req.file.mimetype.split("/")[1] ?? "jpg";
        const path = `${profileId}/${uuid()}.${ext}`;
        const { error } = await supabaseAdmin.storage
          .from("forum-images")
          .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (error) throw error;
        imageUrl = supabaseAdmin.storage.from("forum-images").getPublicUrl(path).data.publicUrl;
      }

      // Fetch pin comments to carry over (if created from a pin)
      const pinComments = sourcePinId
        ? await prisma.pinComment.findMany({
            where: { pinId: sourcePinId },
            orderBy: { createdAt: "asc" },
          })
        : [];

      const forum = await prisma.forum.create({
        data: {
          profileId,
          title: title.trim(),
          body: body?.trim() || null,
          imageUrl,
          sourcePinId: sourcePinId || null,
          commentCount: pinComments.length,
        },
        include: { profile: { select: { fullName: true } } },
      });

      if (pinComments.length > 0) {
        await prisma.forumComment.createMany({
          data: pinComments.map((c) => ({
            forumId: forum.id,
            profileId: c.profileId,
            text: c.text,
            createdAt: c.createdAt,
          })),
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: forum.id,
          profileId: forum.profileId,
          authorName: forum.profile.fullName,
          title: forum.title,
          body: forum.body,
          imageUrl: forum.imageUrl,
          likeCount: 0,
          commentCount: 0,
          createdAt: forum.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/forums/:id ───────────────────────────────────────────────────

router.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;

      const forum = await prisma.forum.findUnique({
        where: { id },
        select: { profileId: true, imageUrl: true },
      });

      if (!forum) {
        res.status(404).json({ success: false, error: "Forum not found" });
        return;
      }
      if (forum.profileId !== profileId) {
        res.status(403).json({ success: false, error: "Not authorized" });
        return;
      }

      // Remove image from storage if one was uploaded
      if (forum.imageUrl) {
        const parts = forum.imageUrl.split("/forum-images/");
        if (parts[1]) {
          await supabaseAdmin.storage.from("forum-images").remove([decodeURIComponent(parts[1])]);
        }
      }

      await prisma.forum.delete({ where: { id } });
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/forums/:id ──────────────────────────────────────────────────────

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const forum = await prisma.forum.findUnique({
        where: { id },
        include: { profile: { select: { fullName: true } } },
      });
      if (!forum) {
        res.status(404).json({ success: false, error: "Forum not found" });
        return;
      }
      res.json({
        success: true,
        data: {
          id: forum.id,
          profileId: forum.profileId,
          authorName: forum.profile.fullName,
          title: forum.title,
          body: forum.body,
          imageUrl: forum.imageUrl,
          likeCount: forum.likeCount,
          commentCount: forum.commentCount,
          createdAt: forum.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/forums/:id/like ────────────────────────────────────────────────

router.post(
  "/:id/like",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;

      const existing = await prisma.forumLike.findUnique({
        where: { forumId_profileId: { forumId: id, profileId } },
      });

      if (existing) {
        await prisma.forumLike.delete({ where: { forumId_profileId: { forumId: id, profileId } } });
        await prisma.forum.update({ where: { id }, data: { likeCount: { decrement: 1 } } });
      } else {
        await prisma.forumLike.create({ data: { forumId: id, profileId } });
        await prisma.forum.update({ where: { id }, data: { likeCount: { increment: 1 } } });
      }

      const forum = await prisma.forum.findUnique({ where: { id }, select: { likeCount: true } });
      res.json({ success: true, data: { likeCount: forum?.likeCount ?? 0, hasLiked: !existing } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/forums/:id/comments ────────────────────────────────────────────

router.get(
  "/:id/comments",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

      const comments = await prisma.forumComment.findMany({
        where: { forumId: id },
        include: { profile: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
        take: 50,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      res.json({
        success: true,
        data: comments.map((c) => ({
          id: c.id,
          forumId: c.forumId,
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

// ─── POST /api/forums/:id/comments ───────────────────────────────────────────

router.post(
  "/:id/comments",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const profileId = req.user!.profileId;
      const text = (req.body as { text?: string }).text?.trim();

      if (!text) {
        res.status(400).json({ success: false, error: "Comment text is required" });
        return;
      }

      const forum = await prisma.forum.findUnique({ where: { id }, select: { id: true } });
      if (!forum) {
        res.status(404).json({ success: false, error: "Forum not found" });
        return;
      }

      const [comment] = await prisma.$transaction([
        prisma.forumComment.create({
          data: { forumId: id, profileId, text },
          include: { profile: { select: { fullName: true } } },
        }),
        prisma.forum.update({ where: { id }, data: { commentCount: { increment: 1 } } }),
      ]);

      res.status(201).json({
        success: true,
        data: {
          id: comment.id,
          forumId: comment.forumId,
          profileId: comment.profileId,
          authorName: (comment as any).profile.fullName,
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
