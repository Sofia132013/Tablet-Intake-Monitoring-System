import prisma from '../lib/prisma.js';

export async function getSchedules(req, res) {
    try {
        const { date } = req.query;
        const where = {
            medication: {
                userLogin: req.user.login,
            },
        };

        if (date) {
            where.date = date;
        }

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                medication: true,
            },
            orderBy: {
                time: 'asc',
            },
        });

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createSchedule(req, res) {
    try {
        const { medicationId, date, time } = req.body;

        if (!medicationId || !date || !time) {
            return res.status(400).json({
                error: 'medicationId, date, and time are required',
            });
        }

        const medication = await prisma.medication.findFirst({
            where: {
                id: medicationId,
                userLogin: req.user.login,
            },
        });

        if (!medication) {
            return res.status(404).json({ error: 'Medication not found' });
        }

        const schedule = await prisma.schedule.create({
            data: {
                medicationId,
                date,
                time,
            },
            include: {
                medication: true,
            },
        });

        res.status(201).json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
