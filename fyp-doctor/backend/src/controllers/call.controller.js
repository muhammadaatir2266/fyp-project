const prisma = require('../config/database');

const getCalls = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const calls = await prisma.callLog.findMany({
      where: { doctorId },
      orderBy: {
        startedAt: 'desc'
      }
    });

    res.json(calls);
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCallById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const call = await prisma.callLog.findFirst({
      where: {
        id,
        doctorId
      }
    });

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCalls, getCallById };
