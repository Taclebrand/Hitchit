import { type Express, type Request, type Response, type NextFunction } from 'express';
import compression from 'compression';
import path from 'path';

// Mobile-specific security and performance headers
export function addMobileSecurityHeaders(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Security headers for mobile browsers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy for mobile security - allows required external services
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com https://hooks.stripe.com https://maps.googleapis.com https://apis.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ wss: https:; " +
      "script-src 'self' https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; " +
      "img-src 'self' data: https: blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "worker-src 'self' blob:; " +
      "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://apis.google.com;");
    
    // HTTPS enforcement for PWA (only in production)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Redirect HTTP to HTTPS in production
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.header('host')}${req.url}`);
      }
    }
    
    // Cache control for different resource types
    const url = req.url;
    
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      // Static assets - cache for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url === '/manifest.json' || url === '/sw.js') {
      // PWA files - cache for 1 day but allow revalidation
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    } else if (url.startsWith('/api/')) {
      // API endpoints - no cache for sensitive data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // HTML pages - cache for 5 minutes but allow revalidation
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    }
    
    next();
  });
}

// Mobile-optimized compression
export function addMobileCompression(app: Express): void {
  app.use(compression({
    // Higher compression for mobile to reduce bandwidth usage
    level: 6,
    threshold: 1024, // Compress files larger than 1KB
    filter: (req: Request, res: Response) => {
      // Let compression handle default filtering, only exclude if needed
      if (res.getHeader('cache-control')?.toString().includes('no-transform')) {
        return false;
      }
      // Allow compression for all compressible content types
      return compression.filter(req, res);
    }
  }));
}

// Mobile-specific route handling
export function addMobileRoutes(app: Express): void {
  // Service worker route with proper headers
  app.get('/sw.js', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.resolve(process.cwd(), 'client/public/sw.js'));
  });
  
  // Web app manifest with proper headers
  app.get('/manifest.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.resolve(process.cwd(), 'client/public/manifest.json'));
  });
  
  // Apple touch icon handling
  app.get('/apple-touch-icon*.png', (req: Request, res: Response) => {
    const iconPath = req.path.replace('/apple-touch-icon', '/icons/icon');
    res.redirect(iconPath);
  });
  
  // Robots.txt for mobile crawlers
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml

# Mobile-optimized crawling
User-agent: Googlebot-Mobile
Allow: /

User-agent: Bingbot
Allow: /`);
  });
}

// Mobile performance monitoring
export function addMobilePerformanceMonitoring(app: Express): void {
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    // Use writeHead hook to set timing header before response is sent
    const originalWriteHead = res.writeHead;
    res.writeHead = function(statusCode: number, statusMessage?: string | any, headers?: any): any {
      const duration = Date.now() - start;
      
      // Log slow API calls that might affect mobile UX
      if (duration > 2000) {
        console.warn(`[MOBILE-PERF] Slow API call: ${req.method} ${req.path} took ${duration}ms`);
      }
      
      // Set performance header before headers are written
      this.setHeader('X-Response-Time', `${duration}ms`);
      
      // Call original writeHead
      if (typeof statusMessage === 'string') {
        return originalWriteHead.call(this, statusCode, statusMessage, headers);
      } else {
        return originalWriteHead.call(this, statusCode, statusMessage);
      }
    };
    
    next();
  });
}

// Initialize all mobile deployment configurations
export function initMobileDeployment(app: Express): void {
  console.log('[MOBILE-DEPLOY] Initializing mobile deployment configurations...');
  
  // Apply mobile-specific middleware in order
  addMobileCompression(app);
  
  // Only apply security headers in production to avoid breaking Vite HMR in development
  if (process.env.NODE_ENV === 'production') {
    console.log('[MOBILE-DEPLOY] Applying production security headers...');
    addMobileSecurityHeaders(app);
  } else {
    console.log('[MOBILE-DEPLOY] Skipping security headers in development for Vite HMR compatibility');
  }
  
  addMobilePerformanceMonitoring(app);
  addMobileRoutes(app);
  
  console.log('[MOBILE-DEPLOY] Mobile deployment configurations initialized');
}