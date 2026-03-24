const prisma = require('../config/database');

const apiTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'API token required. Include in header: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { admin: true }
    });

    if (!apiToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API token'
      });
    }

    if (!apiToken.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API token has been revoked'
      });
    }

    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
      return res.status(403).json({
        success: false,
        message: 'API token has expired'
      });
    }

    // Update last used timestamp and usage count
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      }
    });

    req.apiToken = apiToken;
    req.tokenId = apiToken.id;
    next();
  } catch (error) {
    console.error('API token middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating API token'
    });
  }
};

module.exports = apiTokenMiddleware;
