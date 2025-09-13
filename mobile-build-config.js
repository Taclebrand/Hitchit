// Mobile-optimized build configuration enhancements
// This file provides additional Vite configuration for mobile deployment

export const mobileOptimizations = {
  build: {
    // Mobile-optimized chunk strategy
    rollupOptions: {
      output: {
        // Smaller chunk sizes for better mobile loading
        manualChunks: {
          // Core React dependencies
          'react-vendor': ['react', 'react-dom'],
          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-button', 'lucide-react'],
          // Utility libraries
          'utils-vendor': ['clsx', 'date-fns', 'zod'],
          // Mobile-specific features
          'mobile-features': ['@/utils/mobile-optimizations', '@/hooks/use-mobile-gestures'],
          // PWA features
          'pwa-features': ['@/utils/pwa', '@/components/PWAInstallPrompt']
        },
        // Optimize asset names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Mobile-optimized build settings
    target: ['es2020', 'chrome80', 'safari14', 'firefox78'], // Support modern mobile browsers
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production for mobile performance
        drop_console: true,
        drop_debugger: true,
        // Mobile-specific optimizations
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true // Fix Safari 10 issues
      }
    },
    // Optimize for mobile networks
    reportCompressedSize: false, // Disable to speed up builds
    chunkSizeWarningLimit: 500, // Warn for chunks > 500kb (mobile-appropriate)
    // Enable source maps for mobile debugging in production
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
  },

  // Mobile-optimized development server settings
  server: {
    // Better mobile testing support
    host: true, // Allow external connections for mobile device testing
    port: 5000,
    strictPort: true,
    // Mobile-friendly CORS
    cors: {
      origin: true,
      credentials: true
    },
    // Optimize for mobile development
    hmr: {
      // Reduce HMR overhead for mobile devices
      overlay: {
        warnings: false,
        errors: true
      }
    }
  },

  // Mobile PWA optimizations
  pwa: {
    // Service worker configuration for mobile
    registerType: 'autoUpdate',
    workbox: {
      // Mobile-optimized caching strategies
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\./,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 3, // Fast timeout for mobile
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 50, // Limit for mobile storage
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ],
      // Mobile-appropriate precaching
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB limit for mobile
      cleanupOutdatedCaches: true
    }
  },

  // Mobile performance optimizations
  optimizeDeps: {
    include: [
      // Pre-bundle mobile-critical dependencies
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter',
      'lucide-react'
    ],
    // Exclude heavy dependencies from pre-bundling for mobile
    exclude: [
      '@mapbox/mapbox-gl-js',
      'firebase'
    ]
  },

  // Mobile-specific CSS optimizations
  css: {
    postcss: {
      plugins: [
        // Mobile-first responsive design
        require('autoprefixer')({
          overrideBrowserslist: [
            'iOS >= 12',
            'Android >= 8',
            'Chrome >= 80',
            'Safari >= 14'
          ]
        })
      ]
    },
    // Minimize CSS for mobile
    devSourcemap: false,
  }
};

// Mobile deployment checklist
export const mobileDeploymentChecklist = {
  pwa: {
    manifest: '✓ Web App Manifest configured with mobile-appropriate settings',
    serviceWorker: '✓ Service Worker with offline support and mobile caching strategies',
    icons: '✓ Complete icon set including maskable icons for Android',
    installPrompt: '✓ Install prompt component for mobile installation'
  },
  performance: {
    bundleSize: '⚠ Monitor bundle sizes - target <500KB per chunk for mobile',
    imageOptimization: '✓ Lazy loading and responsive images implemented',
    compression: '✓ Gzip/Brotli compression enabled for mobile bandwidth',
    caching: '✓ Aggressive caching for static assets, careful API caching'
  },
  mobile: {
    viewport: '✓ Proper viewport meta tag for mobile scaling',
    touchTargets: '✓ Touch-friendly button sizes (44px minimum)',
    gestures: '✓ Custom gesture handling for mobile interactions',
    haptics: '✓ Haptic feedback for enhanced mobile UX'
  },
  security: {
    https: '⚠ HTTPS required for PWA features and mobile app stores',
    headers: '✓ Security headers configured for mobile browsers',
    permissions: '✓ Proper permission handling for mobile features'
  }
};