import prisma from '../lib/prisma.js';

export async function getMedications(req, res) {
    try {
        const medications = await prisma.medication.findMany({
            where: { userLogin: req.user.login },
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
        const { name, dosage } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Medication name required' });
        }

        const medication = await prisma.medication.create({
            data: {
                name,
                dosage,
                userLogin: req.user.login,
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

        const result = await prisma.medication.deleteMany({
            where: {
                id,
                userLogin: req.user.login,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Medication not found' });
        }

        res.json({ message: 'Medication deleted' });
    } catch (err) {
        res.status(404).json({ error: 'Medication not found' });
    }
}
