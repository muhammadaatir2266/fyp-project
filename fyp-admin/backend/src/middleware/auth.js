const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { admin: true }
    });

    if (!user || user.role !== 'ADMIN' || !user.admin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!user.admin.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated' });
    }

    req.user = user;
    req.adminId = user.admin.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
