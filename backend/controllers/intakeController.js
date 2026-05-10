const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createIntake = async (req, res) => {
  try {
    const { scheduleId, notes } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID is required' });
    }

    const intake = await prisma.intake.create({
      data: {
        scheduleId,
        notes: notes?.trim() || null,
        status: 'taken',
        userId: req.user.id
      },
      include: {
        schedule: {
          include: {
            medication: true
          }
        }
      }
    });

    res.status(201).json(intake);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIntakeHistory = async (req, res) => {
  try {
    const intakes = await prisma.intake.findMany({
      where: { userId: req.user.id },
      include: {
        schedule: {
          include: {
            medication: true
          }
        }
      },
      orderBy: {
        takenAt: 'desc'
      }
    });

    res.json(intakes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};