const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const getAvailability = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        availableFrom: true,
        availableTo: true,
        workingDays: true,
        unavailableDates: true
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { availableFrom, availableTo, workingDays, unavailableDates } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        availableFrom,
        availableTo,
        workingDays,
        ...(unavailableDates && { unavailableDates })
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      qualifications,
      experience,
      consultationFee
    } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(qualifications && { qualifications }),
        ...(experience !== undefined && { experience: parseInt(experience) }),
        ...(consultationFee !== undefined && { consultationFee: parseFloat(consultationFee) })
      },
      include: {
        specialty: true
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const { emailNotifications, smsNotifications } = req.body;

    res.json({
      message: 'Notification settings updated',
      emailNotifications,
      smsNotifications
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings
};
