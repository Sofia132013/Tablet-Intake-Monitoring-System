import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import Joi from 'joi';
import crypto from 'crypto';
import medicationRoutes from './routes/medicationRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const PREFIX = '/api/v1';

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use('/', medicationRoutes);
app.use('/', intakeRoutes);
app.use(PREFIX, medicationRoutes);
app.use(PREFIX, intakeRoutes);

app.get(`${PREFIX}/health`, (req, res) => {
    res.json({ status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
     });
});

function validate(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        next();
    };
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
}

function checkPassword(password, savedPassword) {
    const [salt, hash] = savedPassword.split(':');
    const passwordHash = crypto.scryptSync(password, salt, 64);
    const savedHash = Buffer.from(hash, 'hex');

    return crypto.timingSafeEqual(passwordHash, savedHash);
}

app.get(`${PREFIX}/users/:login`, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { login: req.params.login },
            include: { medications: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            login: user.login,
            medications: user.medications,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
})

const userSchema = Joi.object({
    login: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(4).max(100).required(),
})

app.post(`${PREFIX}/users`, validate(userSchema), async (req, res) => {
    try {
        const { login, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { login },
        });

        if (user) {
            const isPasswordRight = checkPassword(password, user.password);

            if (!isPasswordRight) {
                return res.status(401).json({ error: 'Wrong password' });
            }

            return res.json({
                message: 'Login successful',
                user: {
                    login: user.login,
                },
            });
        }

        const newUser = await prisma.user.create({
            data: {
                login,
                password: hashPassword(password),
            },
        });

        res.status(201).json({
            message: 'User registered',
            user: {
                login: newUser.login,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
})

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function closeServer(server) {
    return new Promise((resolve, reject) => {
        server.close(err => {
            if (err) {
                reject(err); 
            } else {
                resolve();   
            }
        });
    });
}

async function gracefulShutdown() {
    console.log('Shutting down gracefully...');
    try{
        await closeServer(server);
        await prisma.$disconnect();
        process.exit(0);

    }catch (err) {
        console.error('Shutdown error:', err);
        process.exit(1);
    }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
