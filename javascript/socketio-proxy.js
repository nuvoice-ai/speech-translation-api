// socketio-proxy.js
  const http = require('http');
  const { Server } = require('socket.io');
  const { io: upstreamIo } = require('socket.io-client');

  const UPSTREAM = 'http://api.nuvoice.ai:8000'; // Socket.IO origin
  const PORT = 3000;

  const server = http.createServer();
  const io = new Server(server, {
    cors: { origin: '*' }, // adjust as needed
    // path: '/socket.io', // set if upstream uses custom path
  });

  io.on('connection', (clientSocket) => {
    // mirror auth/query/path if needed
    const upstream = upstreamIo(UPSTREAM, {
      transports: clientSocket.conn.transports, // keep transport choice
      auth: clientSocket.handshake.auth,
      query: clientSocket.handshake.query,
      // path: '/socket.io', // set if upstream uses custom path
    });

    // downstream -> upstream
    clientSocket.onAny((event, ...args) => upstream.emit(event, ...args));
    clientSocket.on('disconnect', (reason) => upstream.disconnect());

    // upstream -> downstream
    upstream.onAny((event, ...args) => clientSocket.emit(event, ...args));
    upstream.on('disconnect', (reason) => clientSocket.disconnect(true));
    upstream.on('connect_error', (err) => clientSocket.emit('proxy_error', err.message));
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO proxy on http://localhost:${PORT} -> ${UPSTREAM}`);
  });