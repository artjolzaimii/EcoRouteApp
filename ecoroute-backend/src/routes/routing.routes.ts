import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { generateRoutes } from "../services/routing.service";

const router = Router();

const RouteRequestSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  originAddress: z.string().min(1).max(300),
  destAddress: z.string().min(1).max(300),
});

// ─── POST /api/routes ─────────────────────────────────────────────────────────
// Frontend screens: routes.tsx, search.tsx, home index.tsx

router.post(
  "/",
  requireAuth,
  validateBody(RouteRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof RouteRequestSchema>;
      const routes = await generateRoutes(body);

      res.json({
        success: true,
        data: {
          routes,
          count: routes.length,
          recommended: routes.find((r) => r.isRecommended) ?? routes[0] ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
