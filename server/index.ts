import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  try {
    log('Starting server initialization...');
    
    const server = await registerRoutes(app);
    log('Routes registered successfully');

    // КРИТИЧЕСКИ ВАЖНО: .well-known middleware ДО Vite и serveStatic
    // Работает в dev и prod режимах
    app.get('/.well-known/assetlinks.json', (_req, res) => {
      const filePath = app.get("env") === "development"
        ? path.resolve(import.meta.dirname, "..", "client", "public", ".well-known", "assetlinks.json")
        : path.resolve(import.meta.dirname, "public", ".well-known", "assetlinks.json");
      
      res.type("application/json").sendFile(filePath);
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log error for debugging
      console.error('Error:', {
        status,
        message,
        stack: err.stack
      });

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log('Setting up Vite in development mode...');
      await setupVite(app, server);
      log('Vite setup completed');
    } else {
      log('Setting up static file serving for production...');
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    log(`Attempting to start server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 Server successfully started on port ${port}`);
      log(`Environment: ${app.get("env")}`);
      log(`Available at: http://0.0.0.0:${port}`);
    });

    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Trying to restart...`);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
