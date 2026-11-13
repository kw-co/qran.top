import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Automatically stamps dist/version.json and dist/service-worker.js with a unique
 * build version on every `npm run build` (including GitHub Actions deployments),
 * ensuring users always receive updates without manual version bumping.
 */
function autoVersionStampPlugin(): Plugin {
  return {
    name: 'auto-version-stamp',
    apply: 'build',
    closeBundle() {
      try {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const buildId = `1.2.${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}.${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
        const distDir = path.resolve(__dirname, 'dist');

        if (!fs.existsSync(distDir)) return;

        // 1. Write fresh dist/version.json
        const versionFile = path.join(distDir, 'version.json');
        fs.writeFileSync(
          versionFile,
          JSON.stringify({ v: buildId, builtAt: now.toISOString() }) + '\n',
          'utf-8'
        );

        // 2. Stamp dist/service-worker.js with matching STATIC_CACHE_NAME
        const swFile = path.join(distDir, 'service-worker.js');
        if (fs.existsSync(swFile)) {
          let swContent = fs.readFileSync(swFile, 'utf-8');
          swContent = swContent.replace(
            /const STATIC_CACHE_NAME = ['"][^'"]+['"];/,
            `const STATIC_CACHE_NAME = 'qran-top-static-${buildId}';`
          );
          fs.writeFileSync(swFile, swContent, 'utf-8');
        }

        // 3. Stamp dist/index.html APP_BUILD_VER
        const indexHtmlFile = path.join(distDir, 'index.html');
        if (fs.existsSync(indexHtmlFile)) {
          let htmlContent = fs.readFileSync(indexHtmlFile, 'utf-8');
          htmlContent = htmlContent.replace(
            /const APP_BUILD_VER = ['"][^'"]+['"];/,
            `const APP_BUILD_VER = '${buildId}';`
          );
          fs.writeFileSync(indexHtmlFile, htmlContent, 'utf-8');
        }

        console.log(`[auto-version-stamp] Stamped build version: ${buildId}`);
      } catch (err) {
        console.warn('[auto-version-stamp] Failed to stamp build version:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: false,
    },
    plugins: [react(), tailwindcss(), autoVersionStampPlugin()],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
