const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.PORTAL_BACKEND_ORIGIN || 'http://127.0.0.1:8000';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
    })
  );
};
