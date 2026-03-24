const prisma = require('../config/database');

const getStats = async (req, res) => {
  try {
    const [
      totalDoctors,
      activeDoctors,
      pendingDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      activeApiTokens,
      totalApiCalls
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isActive: true, verificationStatus: 'APPROVED' } }),
      prisma.doctor.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.apiToken.count({ where: { isActive: true } }),
      prisma.apiLog.count()
    ]);

    // Get API calls today
    const apiCallsToday = await prisma.apiLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Get appointments by source
    const appointmentsBySource = await prisma.appointment.groupBy({
      by: ['source'],
      _count: true
    });

    // Get recent API calls
    const recentApiCalls = await prisma.apiLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        token: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      totalDoctors,
      activeDoctors,
      pendingDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      activeApiTokens,
      totalApiCalls,
      apiCallsToday,
      appointmentsBySource,
      recentApiCalls
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const recentAppointments = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(recentAppointments);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getApiLogs = async (req, res) => {
  try {
    const { tokenId, endpoint, startDate, endDate, limit = 50 } = req.query;

    const where = {};

    if (tokenId) {
      where.tokenId = tokenId;
    }

    if (endpoint) {
      where.endpoint = { contains: endpoint };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const logs = await prisma.apiLog.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        token: {
          select: {
            name: true
          }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    console.error('Get API logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getRecentActivity, getApiLogs };
