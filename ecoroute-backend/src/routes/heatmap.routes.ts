import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import polyline from "@mapbox/polyline";
import { supabaseAdmin } from "../config/supabase";
import { validateBody, validateQuery } from "../middleware/validate.middleware";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SaveTripSchema = z.object({
  encoded_polyline: z.string().min(1),
  co2_saved_kg: z.number().nonnegative().optional(),
  distance_km: z.number().nonnegative().optional(),
});

const HeatmapQuerySchema = z.object({
  min_lng: z.coerce.number().min(-180).max(180),
  min_lat: z.coerce.number().min(-90).max(90),
  max_lng: z.coerce.number().min(-180).max(180),
  max_lat: z.coerce.number().min(-90).max(90),
  grid_size: z.coerce.number().positive().max(1).default(0.0005),
});

const ViewportQuerySchema = z.object({
  min_lng: z.coerce.number().min(-180).max(180),
  min_lat: z.coerce.number().min(-90).max(90),
  max_lng: z.coerce.number().min(-180).max(180),
  max_lat: z.coerce.number().min(-90).max(90),
});

// ─── POST /api/heatmap/save ───────────────────────────────────────────────────

router.post(
  "/save",
  validateBody(SaveTripSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof SaveTripSchema>;

      const coords = polyline.decode(body.encoded_polyline);
      if (coords.length < 2) {
        res.status(400).json({ success: false, error: "Polyline must have at least 2 points" });
        return;
      }

      // WKT format requires longitude first: LINESTRING(lng lat, lng lat, ...)
      const wkt = `LINESTRING(${coords.map(([lat, lng]) => `${lng} ${lat}`).join(", ")})`;

      const { data, error } = await supabaseAdmin
        .from("trip_routes")
        .insert({
          user_id: null,
          route_geometry: wkt,
          co2_saved_kg: body.co2_saved_kg ?? null,
          distance_km: body.distance_km ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data: { id: data.id } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/heatmap ─────────────────────────────────────────────────────────

router.get(
  "/",
  validateQuery(HeatmapQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { min_lng, min_lat, max_lng, max_lat, grid_size } =
        req.query as unknown as z.infer<typeof HeatmapQuerySchema>;

      const { data, error } = await supabaseAdmin.rpc("get_route_density", {
        min_lng,
        min_lat,
        max_lng,
        max_lat,
        grid_size,
      });

      if (error) throw error;

      const points = (data as { lat: number; lng: number; count: number }[]) ?? [];
      const maxCount = points.length > 0 ? Math.max(...points.map((p) => p.count)) : 1;

      res.json({ success: true, data: { points, maxCount } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/heatmap/lines ───────────────────────────────────────────────────

router.get(
  "/lines",
  validateQuery(ViewportQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { min_lng, min_lat, max_lng, max_lat } =
        req.query as unknown as z.infer<typeof ViewportQuerySchema>;

      const { data, error } = await supabaseAdmin.rpc("get_route_lines", {
        min_lng,
        min_lat,
        max_lng,
        max_lat,
      });

      if (error) throw error;

      const lines = ((data as { coords_json: string }[]) ?? []).map((row) => {
        const geojson = JSON.parse(row.coords_json) as { coordinates: [number, number][] };
        // GeoJSON coordinates are [lng, lat] — flip to [lat, lng] for the client
        return geojson.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      });

      // Count routes with a unique origin+destination pair (rounded to ~111m grid)
      const round = (n: number) => Math.round(n * 1000) / 1000;
      const seen = new Set<string>();
      for (const line of lines) {
        if (line.length < 2) continue;
        const [sLat, sLng] = line[0];
        const [eLat, eLng] = line[line.length - 1];
        seen.add(`${round(sLat)},${round(sLng)},${round(eLat)},${round(eLng)}`);
      }
      const distinctCount = seen.size;

      res.json({ success: true, data: { lines, count: lines.length, distinctCount } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
