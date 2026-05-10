import prisma from '../lib/prisma.js';

export async function getMedications(req, res) {
    try {
        const medications = await prisma.medication.findMany({
            include: {
                schedules: true,
                intakes: true,
            },
        });

        res.json(medications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function createMedication(req, res) {
    try {
        const { name, dosage, userLogin } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Medication name required' });
        }

        const medication = await prisma.medication.create({
            data: {
                name,
                dosage,
                userLogin: userLogin || null,
            },
        });

        res.status(201).json(medication);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function deleteMedication(req, res) {
    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({ error: 'Wrong medication id' });
        }

        await prisma.medication.delete({
            where: { id },
        });

        res.json({ message: 'Medication deleted' });
    } catch (err) {
        res.status(404).json({ error: 'Medication not found' });
    }
}

export async function getSchedules(req, res) {
    try {
        const schedules = await prisma.schedule.findMany({
            include: { medication: true },
        });

        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

export async function createSchedule(req, res) {
    try {
        const { medicationId, date, time } = req.body;

        if (!date || !time) {
            return res.status(400).json({ error: 'Date and time required' });
        }

        if (!medicationId) {
            return res.status(400).json({ error: 'Medication id required' });
        }

        const schedule = await prisma.schedule.create({
            data: {
                medicationId,
                date,
                time,
            },
        });

        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}
