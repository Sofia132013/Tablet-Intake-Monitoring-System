const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMedications = async (req, res) => {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' }
    });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMedication = async (req, res) => {
  try {
    const { name, dosage } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Medication name is required' });
    }

    const medication = await prisma.medication.create({
      data: {
        dosage: dosage?.trim() || null,
        userId: req.user.id
      }
    });

    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.medication.delete({
      where: { 
        id,
        userId: req.user.id  // Security: only delete own medication
      }
    });

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};