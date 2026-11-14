import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(302, {
    'Location': 'http://127.0.0.1:5173' + req.url,
    'Content-Type': 'text/html'
  });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=http://127.0.0.1:5173/">
  <title>Redirecting to LUNA: Mission Survival...</title>
</head>
<body style="background:#06101E; color:#00E5FF; font-family:sans-serif; text-align:center; padding-top:50px;">
  <h2>🚀 Launching LUNA: Mission Survival...</h2>
  <p>If you are not redirected automatically, <a href="http://127.0.0.1:5173/" style="color:#FFB703;">click here to open http://127.0.0.1:5173/</a></p>
</body>
</html>`);
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 redirecting to http://127.0.0.1:5173/');
});
