import prisma from '../lib/prisma.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {fileURLToPath} from "url";
import path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;

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

function createToken(login) {
    return jwt.sign({ login }, JWT_SECRET, { expiresIn: '7d' });
}

export async function loginOrRegister(req, res) {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ error: 'Login and password are required' });
        }

        const trimmedLogin = login.trim();

        if (trimmedLogin.length < 3) {
            return res.status(400).json({ error: 'Login must be at least 3 characters' });
        }

        const user = await prisma.user.findUnique({
            where: { login: trimmedLogin },
        });

        if (user) {
            const isPasswordValid = checkPassword(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Incorrect password' });
            }

            return res.json({
                message: 'Login successful',
                user: {
                    login: user.login,
                },
                token: createToken(user.login),
            });
        }

        const newUser = await prisma.user.create({
            data: {
                login: trimmedLogin,
                password: hashPassword(password),
            },
        });

        return res.status(201).json({
            message: 'Account created successfully',
            user: {
                login: newUser.login,
            },
            token: createToken(newUser.login),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
