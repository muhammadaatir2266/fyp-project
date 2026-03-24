const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    });

    if (!user || user.role !== 'ADMIN' || !user.admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.admin.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: user.admin.id,
        firstName: user.admin.firstName,
        lastName: user.admin.lastName,
        email: user.email,
        isSuperAdmin: user.admin.isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json(admin);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getProfile };
