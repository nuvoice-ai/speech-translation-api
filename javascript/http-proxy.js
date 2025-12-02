 // proxy.js
const http = require('http');
const https = require('https');

const UPSTREAM = 'http://api.nuvoice.ai:8000'; // base URL you want to proxy to

const server = http.createServer((req, res) => {
    const targetUrl = new URL(req.url, UPSTREAM);
    const client = targetUrl.protocol === 'https:' ? https : http;

    const proxyReq = client.request(
        targetUrl,
        {
            method: req.method,
            headers: { ...req.headers, host: targetUrl.host }, // keep headers as-is, fix Host
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res);
        }
    );

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) res.writeHead(502);
        res.end('Bad gateway');
    });

    req.pipe(proxyReq);
});

server.listen(3000, () => {
    console.log(`Proxy running on http://localhost:3000 -> ${UPSTREAM}`);
});