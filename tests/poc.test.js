import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  medication: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  schedule: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  intake: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

await jest.unstable_mockModule('../backend/lib/prisma.js', () => ({
  default: prismaMock,
}));

const { loginOrRegister } = await import('../backend/controllers/authController.js');
const { createMedication, getMedications } = await import('../backend/controllers/medicationController.js');
const { createSchedule, getSchedules } = await import('../backend/controllers/scheduleController.js');
const { createIntake, getIntakeHistory } = await import('../backend/controllers/intakeController.js');

function createResponse() {
  return {
    body: undefined,
    statusCode: 200,
    status: jest.fn(function status(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function json(payload) {
      this.body = payload;
      return this;
    }),
  };
}

describe('PoC API controller tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'poc-test-secret';
  });

  test('registers a new user and returns a JWT token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ login: 'patient01' });

    const req = { body: { login: ' patient01 ', password: 'safe-password' } };
    const res = createResponse();

    await loginOrRegister(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.user).toEqual({ login: 'patient01' });
    expect(res.body.token).toEqual(expect.any(String));
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        login: 'patient01',
        password: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+$/),
      },
    });
  });

  test('rejects invalid login payloads', async () => {
    const req = { body: { login: 'ab', password: 'safe-password' } };
    const res = createResponse();

    await loginOrRegister(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'Login must be at least 3 characters' });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test('creates and reads medications for the authenticated user only', async () => {
    const user = { login: 'patient01' };
    const medication = { id: 1, name: 'Aspirin', dosage: '100mg', userLogin: user.login };
    prismaMock.medication.create.mockResolvedValue(medication);
    prismaMock.medication.findMany.mockResolvedValue([{ ...medication, schedules: [], intakes: [] }]);

    const createRes = createResponse();
    await createMedication({ user, body: { name: 'Aspirin', dosage: '100mg' } }, createRes);

    const listRes = createResponse();
    await getMedications({ user }, listRes);

    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(prismaMock.medication.create).toHaveBeenCalledWith({
      data: { name: 'Aspirin', dosage: '100mg', userLogin: user.login },
    });
    expect(prismaMock.medication.findMany).toHaveBeenCalledWith({
      where: { userLogin: user.login },
      include: { schedules: true, intakes: true },
    });
    expect(listRes.body).toHaveLength(1);
  });

  test('prevents scheduling a medication owned by another user', async () => {
    prismaMock.medication.findFirst.mockResolvedValue(null);

    const res = createResponse();
    await createSchedule(
      {
        user: { login: 'patient01' },
        body: { medicationId: 7, date: '2026-05-12', time: '09:00' },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: 'Medication not found' });
    expect(prismaMock.schedule.create).not.toHaveBeenCalled();
  });

  test('creates a schedule and returns schedules ordered by time', async () => {
    const user = { login: 'patient01' };
    const medication = { id: 1, name: 'Aspirin', userLogin: user.login };
    const schedule = { id: 10, medicationId: medication.id, date: '2026-05-12', time: '08:30', medication };
    prismaMock.medication.findFirst.mockResolvedValue(medication);
    prismaMock.schedule.create.mockResolvedValue(schedule);
    prismaMock.schedule.findMany.mockResolvedValue([schedule]);

    const createRes = createResponse();
    await createSchedule(
      { user, body: { medicationId: 1, date: '2026-05-12', time: '08:30' } },
      createRes,
    );

    const listRes = createResponse();
    await getSchedules({ user, query: { date: '2026-05-12' } }, listRes);

    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(prismaMock.schedule.findMany).toHaveBeenCalledWith({
      where: { medication: { userLogin: user.login }, date: '2026-05-12' },
      include: { medication: true },
      orderBy: { time: 'asc' },
    });
    expect(listRes.body).toEqual([schedule]);
  });

  test('records intake history for an existing medication', async () => {
    const user = { login: 'patient01' };
    const medication = { id: 1, name: 'Aspirin', userLogin: user.login };
    const intake = { id: 4, medicationId: 1, date: '2026-05-12', time: '08:40', taken: true };
    prismaMock.medication.findFirst.mockResolvedValue(medication);
    prismaMock.intake.create.mockResolvedValue(intake);
    prismaMock.intake.findMany.mockResolvedValue([{ ...intake, medication }]);

    const createRes = createResponse();
    await createIntake(
      { user, body: { medicationId: 1, date: '2026-05-12', time: '08:40', taken: true } },
      createRes,
    );

    const historyRes = createResponse();
    await getIntakeHistory({ user }, historyRes);

    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(prismaMock.intake.create).toHaveBeenCalledWith({
      data: { medicationId: 1, date: '2026-05-12', time: '08:40', taken: true },
    });
    expect(prismaMock.intake.findMany).toHaveBeenCalledWith({
      where: { medication: { userLogin: user.login } },
      include: { medication: true },
      orderBy: { id: 'desc' },
    });
    expect(historyRes.body).toEqual([{ ...intake, medication }]);
  });
});
