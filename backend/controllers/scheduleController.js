const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSchedules = async (req, res) => {
  try {
    const { date } = req.query;

    const where = {
      userId: req.user.id,
      ...(date && { scheduledDate: new Date(date) })
    };

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        medication: true,
        intakes: true
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { medicationId, scheduledDate, scheduledTime, notes } = req.body;

    if (!medicationId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ 
        error: 'medicationId, scheduledDate, and scheduledTime are required' 
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        medicationId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        notes: notes?.trim() || null,
        userId: req.user.id
      },
      include: {
        medication: true
      }
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};