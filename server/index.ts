import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// SSE Configuration
const STREAM_KEY = process.env.STREAM_KEY || '';
const clients = new Set<Response>();

function sseWrite(res: Response, event: string, payload: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function broadcast(event: string, payload: any) {
  for (const res of clients) {
    try {
      sseWrite(res, event, payload);
    } catch {
      // Client disconnected, will be cleaned up on 'close' event
    }
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // SSE Endpoint for real-time updates
  app.get('/events', (req: Request, res: Response) => {
    // Optional stream key validation
    if (STREAM_KEY && req.query.streamKey !== STREAM_KEY) {
      return res.status(401).end();
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial comment to open the stream
    res.write(': ok\n\n');

    // Add client to the set
    clients.add(res);

    // Heartbeat to keep connection alive (every 25s)
    const heartbeat = setInterval(() => {
      try {
        res.write(`: hb ${Date.now()}\n\n`);
      } catch {
        // Connection closed, will be cleaned up
      }
    }, 25000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  });

  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();
