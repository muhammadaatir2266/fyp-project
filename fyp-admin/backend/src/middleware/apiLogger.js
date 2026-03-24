const prisma = require('../config/database');

const apiLoggerMiddleware = async (req, res, next) => {
  const originalSend = res.send;
  let responseBody;

  res.send = function (data) {
    responseBody = data;
    originalSend.call(this, data);
  };

  res.on('finish', async () => {
    try {
      if (req.tokenId) {
        await prisma.apiLog.create({
          data: {
            tokenId: req.tokenId,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            requestBody: req.body ? JSON.stringify(req.body) : null,
            responseBody: responseBody ? responseBody.substring(0, 5000) : null, // Limit size
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }
    } catch (error) {
      console.error('API logging error:', error);
    }
  });

  next();
};

module.exports = apiLoggerMiddleware;
