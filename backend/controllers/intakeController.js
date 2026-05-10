import prisma from '../lib/prisma.js';

export async function createIntake(req, res) {
    try {
        const { medicationId, date, time, taken } = req.body;

        if (!date || !time) {
            return res.status(400).json({ error: 'Date and time required' });
        }

        if (!medicationId) {
            return res.status(400).json({ error: 'Medication id required' });
        }

        const intake = await prisma.intake.create({
            data: {
                medicationId,
                date,
                time,
                taken,
            },
        });

        res.status(201).json(intake);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getIntakeHistory(req, res) {
    try {
        const history = await prisma.intake.findMany({
            include: { medication: true },
            orderBy: { id: 'desc' },
        });

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}
