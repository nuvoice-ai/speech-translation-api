// proxy.js
  const http = require('http');
  const https = require('https');
  const { Server } = require('socket.io');
  const { io: upstreamIo } = require('socket.io-client');

  const UPSTREAM = 'http://api.nuvoice.ai:8000'; // base URL of the upstream
  const PORT = 3000;

  const server = http.createServer((req, res) => {
    const targetUrl = new URL(req.url, UPSTREAM);
    const client = targetUrl.protocol === 'https:' ? https : http;

    const proxyReq = client.request(
      targetUrl,
      {
        method: req.method,
        headers: { ...req.headers, host: targetUrl.host },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('HTTP proxy error:', err.message);
      if (!res.headersSent) res.writeHead(502);
      res.end('Bad gateway');
    });

    req.pipe(proxyReq);
  });

  // Attach Socket.IO on the same HTTP server
  const io = new Server(server, {
    cors: { origin: '*' }, // adjust as needed
    // path: '/socket.io', // uncomment if using a custom path
  });

  io.on('connection', (clientSocket) => {
    const upstream = upstreamIo(UPSTREAM, {
      transports: clientSocket.conn.transports,
      auth: clientSocket.handshake.auth,
      query: clientSocket.handshake.query,
      // path: '/socket.io', // match upstream if customized
    });

    // downstream -> upstream
    clientSocket.onAny((event, ...args) => upstream.emit(event, ...args));
    clientSocket.on('disconnect', () => upstream.disconnect());

    // upstream -> downstream
    upstream.onAny((event, ...args) => clientSocket.emit(event, ...args));
    upstream.on('disconnect', () => clientSocket.disconnect(true));
    upstream.on('connect_error', (err) =>
      clientSocket.emit('proxy_error', err.message)
    );
  });

  server.listen(PORT, () => {
    console.log(`HTTP + Socket.IO proxy on http://localhost:${PORT} -> ${UPSTREAM}`);
  });