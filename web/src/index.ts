import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";

import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import cardsRoutes from "./routes/cards";
import attendanceRoutes from "./routes/attendance";
import scanRoutes from "./routes/scan";
import accessPointsRoutes from "./routes/accessPoints";
import statsRoutes from "./routes/stats";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

// ── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? `http://localhost:${PORT}`)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (ESP32, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// ── Static files (admin dashboard) ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../public")));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/access-points", accessPointsRoutes);
app.use("/api/stats", statsRoutes);

// ── Page routes ──────────────────────────────────────────────────────────────
const pages: Record<string, string> = {
  "/dashboard": "dashboard.html",
  "/access-logs": "access-logs.html",
  "/user-management": "user-management.html",
  "/hardware": "hardware.html",
};
for (const [route, file] of Object.entries(pages)) {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(__dirname, "../public", file));
  });
}

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] Running at http://localhost:${PORT}`);
  });
}

export default app;
