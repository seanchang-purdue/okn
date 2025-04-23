// server.js
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4321;
const DIST_DIR = path.join(__dirname, 'dist');

// Basic MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.webp': 'image/webp'
};

// Check if a path is likely a static file based on extension
const isStaticFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ext && ext !== '.html' && ext in mimeTypes;
};

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  try {
    // Parse the URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = url.pathname;
    
    // Default to index.html for root path
    if (filePath === '/') {
      filePath = '/index.html';
    }
    
    const fullPath = path.join(DIST_DIR, filePath);
    
    // Check if the requested file exists
    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // If it's a directory, try to serve index.html from that directory
        const indexPath = path.join(fullPath, 'index.html');
        try {
          await fs.access(indexPath);
          const content = await fs.readFile(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        } catch (err) {
          // No index.html in directory, fall through to SPA handling
        }
      } else {
        // It's a file that exists, serve it
        const content = await fs.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      }
    } catch (err) {
      // File doesn't exist
      
      // If it looks like a static file request, return 404
      if (isStaticFile(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      
      // Otherwise, it's likely a route in the SPA, serve index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      const content = await fs.readFile(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Server started: ${new Date().toISOString()}`);
});
