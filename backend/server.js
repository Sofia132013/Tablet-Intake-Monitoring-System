import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import prisma from './lib/prisma.js';
import authRoutes from './routes/authRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import fileRoutes from "./routes/fileRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.OPEN_SERVER_PORT;
const PREFIX = process.env.API_PREFIX;

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use(PREFIX, authRoutes);
app.use(PREFIX, medicationRoutes);
app.use(PREFIX, intakeRoutes);
app.use(PREFIX, scheduleRoutes);

app.use(fileRoutes)

app.get(`${PREFIX}/health`, (req, res) => {
    res.json({ status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
     });
});

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

const server = app.listen(PORT, () => {
    console.log(`${"Replica " + (process.env.REPLICA_NAME || "Server")} is listening on port ${PORT}`);
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
