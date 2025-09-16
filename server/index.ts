import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
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
    
    // 📌 ASSETLINKS.JSON - serve with proper cache control headers
    app.get("/.well-known/assetlinks.json", (req, res) => {
      console.log("[ASSETLINKS] Request received from:", req.ip, "User-Agent:", req.get('User-Agent'));
      
      // Set proper headers to prevent caching issues
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Assetlinks-Source', 'express-route');
      res.setHeader('X-Certificate-Count', '3');
      
      const assetLinksData = [
        {
          "relation": ["delegate_permission/common.handle_all_urls"],
          "target": {
            "namespace": "android_app",
            "package_name": "com.ducharkha.delivery",
            "sha256_cert_fingerprints": [
              "95:5A:D0:1D:AE:08:15:50:5B:7D:F0:E1:96:EC:F8:D5:DB:EA:5E:63:ED:B4:C7:2A:1F:93:E3:9B:FE:3D:EE:66",
              "66:5E:D4:72:6B:02:74:52:F2:E5:B4:43:D6:A4:A0:25:78:24:15:26:F7:F5:79:92:2C:C7:9B:D9:A5:AA:AA:CF",
              "A4:0D:A8:0A:59:D1:70:CA:A9:50:CF:15:C1:8C:45:4D:47:A3:9B:26:98:9D:8B:64:0E:CD:74:5B:A7:31:76:78"
            ]
          }
        }
      ];
      
      console.log("[ASSETLINKS] Returning", assetLinksData[0].target.sha256_cert_fingerprints.length, "certificates");
      res.json(assetLinksData);
    });
    
    const server = await registerRoutes(app);
    log('Routes registered successfully');

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
