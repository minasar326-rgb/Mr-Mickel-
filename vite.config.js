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
        if (req.url && req.url.startsWith('/api/r2-proxy-upload') && req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.url && req.url.startsWith('/api/r2-proxy-upload') && req.method === 'PUT') {
          const urlParam = new URL(req.url, 'http://localhost:3000').searchParams.get('url');
          if (!urlParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing presigned url param' }));
            return;
          }
          import('https').then(({ default: https }) => {
            const targetUrl = new URL(urlParam);
            const headers = { ...req.headers };
            delete headers.host;
            delete headers.origin;
            delete headers.referer;
            const proxyReq = https.request(targetUrl, {
              method: 'PUT',
              headers
            }, (proxyRes) => {
              res.statusCode = proxyRes.statusCode || 200;
              res.setHeader('Access-Control-Allow-Origin', '*');
              proxyRes.pipe(res);
            });
            proxyReq.on('error', (err) => {
              res.statusCode = 500;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ error: err.message }));
            });
            req.pipe(proxyReq);
          }).catch(err => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/optimize-cloud-videos')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.statusCode = 204;
            res.end();
            return;
          }
          import('child_process').then(({ exec }) => {
            exec('node scripts/auto-optimize-cloud-videos.cjs', (error, stdout, stderr) => {
              res.setHeader('Content-Type', 'application/json');
              if (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message, stderr }));
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, log: stdout }));
              }
            });
          });
          return;
        }

        if (req.url === '/api/sync-manifest' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const publicDir = path.resolve(__dirname, 'public');
              if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

              let parsed = null;
              try { parsed = JSON.parse(body); } catch (_) {}

              let existingManifest = null;
              const manifestPath = path.join(publicDir, 'lectures-manifest.json');
              if (fs.existsSync(manifestPath)) {
                try { existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) {}
              }

              const safeStages = (Array.isArray(parsed?.stages) && parsed.stages.length > 0)
                ? parsed.stages
                : (existingManifest?.stages || []);

              const safeSections = (Array.isArray(parsed?.sections) && parsed.sections.length > 0)
                ? parsed.sections
                : (existingManifest?.sections || []);

              const incomingRaw = Array.isArray(parsed) ? parsed : (parsed?.lectures || []);
              const activeIncomingIds = new Set(
                incomingRaw.filter(l => l && l.id && !l.isDeleted).map(l => l.id)
              );

              const safeDeletedIds = Array.from(new Set([
                ...(Array.isArray(parsed?.deletedLectureIds) ? parsed.deletedLectureIds : []),
                ...(Array.isArray(existingManifest?.deletedLectureIds) ? existingManifest.deletedLectureIds : [])
              ])).filter(Boolean);
              const deletedSet = new Set(safeDeletedIds);

              const incomingLectures = (Array.isArray(parsed) ? parsed : (parsed?.lectures || []))
                .filter(l => l && l.id && !deletedSet.has(l.id));
              const existingLectures = (Array.isArray(existingManifest?.lectures) ? existingManifest.lectures : [])
                .filter(l => l && l.id && !deletedSet.has(l.id));

              const lectureMap = new Map();
              existingLectures.forEach(l => lectureMap.set(l.id, l));
              incomingLectures.forEach(l => {
                const prev = lectureMap.get(l.id) || {};
                lectureMap.set(l.id, { ...prev, ...l });
              });
              const safeLectures = Array.from(lectureMap.values()).filter(l => !deletedSet.has(l.id));

              const fullPayload = {
                lectures: safeLectures,
                stages: safeStages,
                sections: safeSections,
                deletedLectureIds: safeDeletedIds,
                updatedAt: new Date().toISOString()
              };
              const jsonStr = JSON.stringify(fullPayload);
              fs.writeFileSync(path.join(publicDir, 'lectures-manifest.json'), jsonStr, 'utf8');

              const jsContent = `(function() {
  var payload = ${JSON.stringify(fullPayload)};
  window.__MS_LECTURES_MANIFEST__ = payload.lectures || payload;
  window.__MS_STAGES_MANIFEST__ = payload.stages || [];
  window.__MS_SECTIONS_MANIFEST__ = payload.sections || [];
  window.__MS_DELETED_LECTURES__ = payload.deletedLectureIds || [];
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

        if (req.url && /^\/lectures-manifest\.js(\?.*)?$/.test(req.url)) {
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

        if (req.url && /^\/lectures-manifest\.json(\?.*)?$/.test(req.url)) {
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
