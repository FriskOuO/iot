const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('--- SetupProxy Loaded! Target: 3005 ---');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3005',
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error: ' + err.message);
      }
    })
  );
};
