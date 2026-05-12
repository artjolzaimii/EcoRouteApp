import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { supabaseAdmin } from "../config/supabase";

const router = Router();
const prisma = new PrismaClient();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const STORAGE_BUCKET = "marketplace-images";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: jpg, jpeg, png, webp."));
    }
  },
});

// All partner routes require auth + PARTNER role
router.use(requireAuth, requireRole("PARTNER"));

// ─── GET /api/partner/me ───────────────────────────────────────────────────────

router.get("/me", async (req, res, next) => {
  try {
    const profile = await (prisma as any).partnerProfile.findUnique({
      where: { profileId: req.user!.profileId },
    });
    if (!profile) {
      res.status(404).json({ success: false, error: "Partner profile not found" });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/partner/me ───────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  businessName:  z.string().min(1).max(200).optional(),
  businessEmail: z.string().email().optional().nullable(),
  phone:         z.string().max(50).optional().nullable(),
  location:      z.string().max(500).optional().nullable(),
  logoUrl:       z.string().url().optional().nullable(),
});

router.put("/me", validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const updated = await (prisma as any).partnerProfile.update({
      where: { profileId: req.user!.profileId },
      data:  req.body,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/partner/listings ─────────────────────────────────────────────────

const listingsQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "INACTIVE"]).optional(),
  limit:  z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  "/listings",
  validateQuery(listingsQuerySchema),
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query as unknown as z.infer<typeof listingsQuerySchema>;

      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const where: Record<string, unknown> = { partnerId: partner.id };
      if (status) where.status = status;

      const [listings, total] = await Promise.all([
        (prisma as any).marketplaceListing.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            category: true,
            images:   { where: { isCover: true }, take: 1 },
          },
        }),
        (prisma as any).marketplaceListing.count({ where }),
      ]);

      // DEBUG — remove after verification
      console.log("[partner/listings] partner_id:", partner.id, "| returned:", total, "| IDs:", listings.map((l: any) => l.id), "| statuses:", listings.map((l: any) => l.status));

      res.json({ success: true, data: { listings, total } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/partner/listings ────────────────────────────────────────────────

const createListingSchema = z.object({
  categoryId:  z.string().min(1),
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  whyEco:      z.string().max(1000).optional(),
  type:        z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  payment:     z.enum(["MONEY_ONLY", "FLEXIBLE"]).default("FLEXIBLE"),
  moneyPrice:  z.number().min(0).optional(),
  pointsPrice: z.number().int().min(0).optional(),
  stock:       z.number().int().min(0).optional(),
  location:    z.string().max(500).optional(),
  status:      z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

router.post(
  "/listings",
  validateBody(createListingSchema),
  async (req, res, next) => {
    try {
      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const listing = await (prisma as any).marketplaceListing.create({
        data: { ...req.body, partnerId: partner.id },
        include: { category: true },
      });

      res.status(201).json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/partner/listings/:id ─────────────────────────────────────────────

router.get("/listings/:id", async (req, res, next) => {
  try {
    const partner = await (prisma as any).partnerProfile.findUnique({
      where: { profileId: req.user!.profileId },
      select: { id: true },
    });
    if (!partner) {
      res.status(404).json({ success: false, error: "Partner profile not found" });
      return;
    }

    const listing = await (prisma as any).marketplaceListing.findFirst({
      where: { id: req.params.id, partnerId: partner.id },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }

    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/partner/listings/:id ─────────────────────────────────────────────

const updateListingSchema = createListingSchema.partial();

router.put(
  "/listings/:id",
  validateBody(updateListingSchema),
  async (req, res, next) => {
    try {
      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const existing = await (prisma as any).marketplaceListing.findFirst({
        where: { id: req.params.id, partnerId: partner.id },
      });
      if (!existing) {
        res.status(404).json({ success: false, error: "Listing not found" });
        return;
      }

      const updated = await (prisma as any).marketplaceListing.update({
        where: { id: req.params.id },
        data:  req.body,
        include: { category: true },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/partner/listings/:id ──────────────────────────────────────────

router.delete("/listings/:id", async (req, res, next) => {
  try {
    const partner = await (prisma as any).partnerProfile.findUnique({
      where: { profileId: req.user!.profileId },
      select: { id: true },
    });
    if (!partner) {
      res.status(404).json({ success: false, error: "Partner profile not found" });
      return;
    }

    const existing = await (prisma as any).marketplaceListing.findFirst({
      where: { id: req.params.id, partnerId: partner.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }

    await (prisma as any).marketplaceListing.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/partner/listings/:id/images ─────────────────────────────────────
//
// Accepts a single image file via multipart/form-data field "image".
// Optional text fields: isCover ("true"/"false").
// Validates MIME type and size, uploads to Supabase Storage, stores record.

router.post(
  "/listings/:id/images",
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No image file provided" });
        return;
      }

      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const listing = await (prisma as any).marketplaceListing.findFirst({
        where: { id: req.params.id, partnerId: partner.id },
      });
      if (!listing) {
        res.status(404).json({ success: false, error: "Listing not found" });
        return;
      }

      // Count existing images to derive sort order
      const existingCount = await (prisma as any).marketplaceImage.count({
        where: { listingId: listing.id },
      });

      const isCover = req.body.isCover === "true" || existingCount === 0;

      // If this is the cover, unset any existing cover
      if (isCover) {
        await (prisma as any).marketplaceImage.updateMany({
          where: { listingId: listing.id, isCover: true },
          data:  { isCover: false },
        });
      }

      // Build a unique storage path
      const ext      = req.file.originalname.split(".").pop() ?? "jpg";
      const filePath = `listings/${listing.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert:      false,
        });

      if (uploadError) {
        res.status(500).json({ success: false, error: uploadError.message });
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const image = await (prisma as any).marketplaceImage.create({
        data: {
          listingId: listing.id,
          url:       urlData.publicUrl,
          isCover,
          sortOrder: existingCount,
        },
      });

      res.status(201).json({ success: true, data: image });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/partner/listings/:id/images/:imageId ──────────────────────────

router.delete("/listings/:id/images/:imageId", async (req, res, next) => {
  try {
    const partner = await (prisma as any).partnerProfile.findUnique({
      where: { profileId: req.user!.profileId },
      select: { id: true },
    });
    if (!partner) {
      res.status(404).json({ success: false, error: "Partner profile not found" });
      return;
    }

    // Ensure listing belongs to this partner
    const listing = await (prisma as any).marketplaceListing.findFirst({
      where: { id: req.params.id, partnerId: partner.id },
    });
    if (!listing) {
      res.status(404).json({ success: false, error: "Listing not found" });
      return;
    }

    const image = await (prisma as any).marketplaceImage.findFirst({
      where: { id: req.params.imageId, listingId: listing.id },
    });
    if (!image) {
      res.status(404).json({ success: false, error: "Image not found" });
      return;
    }

    // Remove from Supabase Storage (extract path from URL)
    const url      = new URL(image.url);
    const segments = url.pathname.split(`/object/public/${STORAGE_BUCKET}/`);
    if (segments.length > 1) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([segments[1]]);
    }

    await (prisma as any).marketplaceImage.delete({ where: { id: image.id } });

    // If deleted image was cover, promote the first remaining image
    if (image.isCover) {
      const next = await (prisma as any).marketplaceImage.findFirst({
        where:   { listingId: listing.id },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await (prisma as any).marketplaceImage.update({
          where: { id: next.id },
          data:  { isCover: true },
        });
      }
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/partner/orders ────────────────────────────────────────────────────

const ordersQuerySchema = z.object({
  status: z.enum(["PENDING", "SIMULATED_PAID", "COMPLETED", "CANCELLED"]).optional(),
  limit:  z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  "/orders",
  validateQuery(ordersQuerySchema),
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query as unknown as z.infer<typeof ordersQuerySchema>;

      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const where: Record<string, unknown> = { partnerId: partner.id };
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        (prisma as any).marketplaceOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            listing: { select: { title: true, payment: true, moneyPrice: true } },
            profile: { select: { fullName: true, email: true } },
          },
        }),
        (prisma as any).marketplaceOrder.count({ where }),
      ]);

      // DEBUG — remove after verification
      console.log("[partner/orders] partner_id:", partner.id, "| returned:", total, "| IDs:", orders.map((o: any) => o.id));

      res.json({ success: true, data: { orders, total } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/partner/orders/:id/status ──────────────────────────────────────

const orderStatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
});

router.patch(
  "/orders/:id/status",
  validateBody(orderStatusSchema),
  async (req, res, next) => {
    try {
      const partner = await (prisma as any).partnerProfile.findUnique({
        where: { profileId: req.user!.profileId },
        select: { id: true },
      });
      if (!partner) {
        res.status(404).json({ success: false, error: "Partner profile not found" });
        return;
      }

      const existing = await (prisma as any).marketplaceOrder.findFirst({
        where: { id: req.params.id, partnerId: partner.id },
      });
      if (!existing) {
        res.status(404).json({ success: false, error: "Order not found" });
        return;
      }

      const updated = await (prisma as any).marketplaceOrder.update({
        where: { id: req.params.id },
        data:  { status: req.body.status },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
