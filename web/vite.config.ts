import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: {
      port: 8080,
      host: "162.0.223.166",
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        // Disable manual chunking in production to prevent React context issues
        manualChunks: mode === 'development' ? (id) => {
          // Vendor chunks - only in development
          if (id.includes('node_modules')) {
            // Keep React ecosystem together
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('tailwindcss-animate')) {
              return 'ui-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            // Charts and data visualization
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('d3') || id.includes('@nivo')) {
              return 'chart-vendor';
            }
            // 3D and visual effects
            if (id.includes('three') || id.includes('vanta')) {
              return 'three-vendor';
            }
            // Maps and networks
            if (id.includes('react-simple-maps') || id.includes('react-vis-network')) {
              return 'map-vendor';
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Date handling
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            // Data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Utility libraries
            if (id.includes('axios') || id.includes('clsx') || id.includes('tailwind-merge') || 
                id.includes('class-variance-authority') || id.includes('sonner') || 
                id.includes('next-themes') || id.includes('cmdk') || id.includes('embla')) {
              return 'utils-vendor';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
        } : undefined,
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
    ],
    exclude: [
      'three',
      'vanta',
    ],
  },
  define: {
    __DEV__: mode === 'development',
  },
}));
