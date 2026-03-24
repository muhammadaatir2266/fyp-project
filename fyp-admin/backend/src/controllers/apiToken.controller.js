const prisma = require('../config/database');
const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getApiTokens = async (req, res) => {
  try {
    const tokens = await prisma.apiToken.findMany({
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            apiLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tokens);
  } catch (error) {
    console.error('Get API tokens error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createApiToken = async (req, res) => {
  try {
    const { name, expiresInDays } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Token name is required' });
    }

    const token = generateToken();
    
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,
        adminId: req.adminId,
        expiresAt
      },
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(apiToken);
  } catch (error) {
    console.error('Create API token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const revokeApiToken = async (req, res) => {
  try {
    const { id } = req.params;

    const apiToken = await prisma.apiToken.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'API token revoked successfully', apiToken });
  } catch (error) {
    console.error('Revoke API token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteApiToken = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.apiToken.delete({
      where: { id }
    });

    res.json({ message: 'API token deleted successfully' });
  } catch (error) {
    console.error('Delete API token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getApiTokenStats = async (req, res) => {
  try {
    const { id } = req.params;

    const token = await prisma.apiToken.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            apiLogs: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({ message: 'API token not found' });
    }

    // Get usage by endpoint
    const usageByEndpoint = await prisma.apiLog.groupBy({
      by: ['endpoint'],
      where: { tokenId: id },
      _count: true,
      orderBy: {
        _count: {
          endpoint: 'desc'
        }
      }
    });

    // Get recent logs
    const recentLogs = await prisma.apiLog.findMany({
      where: { tokenId: id },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      token,
      usageByEndpoint,
      recentLogs
    });
  } catch (error) {
    console.error('Get API token stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getApiTokens,
  createApiToken,
  revokeApiToken,
  deleteApiToken,
  getApiTokenStats
};
