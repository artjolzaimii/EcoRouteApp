import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";

// Route modules
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import badgesRoutes from "./routes/badges.routes";
import challengesRoutes from "./routes/challenges.routes";
import couponsRoutes from "./routes/coupons.routes";
import forumRoutes from "./routes/forum.routes";
import heatmapRoutes from "./routes/heatmap.routes";
import impactRoutes from "./routes/impact.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import partnerRoutes from "./routes/partner.routes";
import partnersRoutes from "./routes/partners.routes";
import pinsRoutes from "./routes/pins.routes";
import routingRoutes from "./routes/routing.routes";
import savedRoutesRoutes from "./routes/saved-routes.routes";
import usersRoutes from "./routes/users.routes";
import notificationsRoutes from "./routes/notifications.routes";

// Global error handler
import { supabaseAdmin } from "./config/supabase";
import { errorMiddleware } from "./middleware/error.middleware";
import tripsRoutes from "./routes/trips.routes";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

// ─── Ensure Supabase Storage bucket exists ────────────────────────────────────

async function ensureStorageBucket() {
  const BUCKETS: { name: string; public: boolean }[] = [
    { name: "marketplace-images", public: true },
    { name: "avatars",            public: true },
  ];

  const { data: existing } = await supabaseAdmin.storage.listBuckets();
  const existingNames = new Set(existing?.map((b) => b.name) ?? []);

  for (const bucket of BUCKETS) {
    if (!existingNames.has(bucket.name)) {
      const { error } = await supabaseAdmin.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      if (error) {
        console.warn(`[storage] Could not create bucket "${bucket.name}": ${error.message}`);
      } else {
        console.log(`[storage] Created bucket "${bucket.name}"`);
      }
    }
  }
}

// ─── CORS allowed origins ─────────────────────────────────────────────────────
// Set ALLOWED_ORIGINS on Render as a comma-separated list, e.g.:
//   https://ecoroute-partner-dashboard.vercel.app,https://ecoroute-admin.vercel.app,https://ecoroute-apply.vercel.app
//
// Requests with no Origin header (mobile apps, server-to-server, health checks)
// are always allowed. Wildcard "*" is never used so credentials/auth headers
// remain supported.

const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // No Origin header → mobile app / server-to-server / health check → allow
      if (!incomingOrigin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(incomingOrigin)) return callback(null, true);
      console.warn(`[cors] Blocked origin: ${incomingOrigin}`);
      callback(new Error(`CORS: origin not allowed — ${incomingOrigin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/routes", routingRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/impact", impactRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/pins", pinsRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/saved-routes", savedRoutesRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
//app.use("/api/referrals", referralsRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(errorMiddleware);

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`🌿 EcoRoute API running on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`);
  await ensureStorageBucket().catch(console.error);
});

export default app;
