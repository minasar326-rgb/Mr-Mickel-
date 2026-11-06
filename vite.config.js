import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function manifestSyncPlugin() {
  return {
    name: 'manifest-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/sync-manifest' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const publicDir = path.resolve(__dirname, 'public');
              if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

              let parsed = null;
              try { parsed = JSON.parse(body); } catch (_) {}

              let lecturesArray = Array.isArray(parsed) ? parsed : (parsed?.lectures || []);
              const jsonStr = JSON.stringify(lecturesArray);
              fs.writeFileSync(path.join(publicDir, 'lectures-manifest.json'), jsonStr, 'utf8');

              const fullPayload = parsed && typeof parsed === 'object' ? parsed : { lectures: lecturesArray };
              const jsContent = `(function() {
  var payload = ${JSON.stringify(fullPayload)};
  window.__MS_LECTURES_MANIFEST__ = payload.lectures || payload;
  window.__MS_STAGES_MANIFEST__ = payload.stages || [];
  window.__MS_SECTIONS_MANIFEST__ = payload.sections || [];
  window.__MS_PLATFORM_MANIFEST__ = payload;
  if (typeof window.__onLecturesManifest === 'function') {
    try { window.__onLecturesManifest(payload); } catch(e) {}
  }
  try {
    window.dispatchEvent(new CustomEvent('ms:platform-manifest-loaded', { detail: payload }));
  } catch(e) {}
})();`;
              fs.writeFileSync(path.join(publicDir, 'lectures-manifest.js'), jsContent, 'utf8');

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/lectures-manifest.js')) {
          const manifestJsPath = path.resolve(__dirname, 'public/lectures-manifest.js');
          if (fs.existsSync(manifestJsPath)) {
            const data = fs.readFileSync(manifestJsPath, 'utf8');
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store');
            res.end(data);
            return;
          }
        }

        if (req.url && req.url.startsWith('/lectures-manifest.json')) {
          const manifestPath = path.resolve(__dirname, 'public/lectures-manifest.json');
          if (fs.existsSync(manifestPath)) {
            const data = fs.readFileSync(manifestPath, 'utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store');
            res.end(data);
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), manifestSyncPlugin()],
  build: {
    assetsDir: '',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
          }
        }
      }
    }
  },
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    host: true,
    open: true
  }
})
