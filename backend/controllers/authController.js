const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

exports.loginOrRegister = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const trimmedLogin = login.trim();
    if (trimmedLogin.length < 3) {
      return res.status(400).json({ error: 'Login must be at least 3 characters' });
    }

    let user = await prisma.user.findUnique({
      where: { username: trimmedLogin }
    });

    if (user) {
      // User exists → Login
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username
        },
        token
      });

    } else {
      // User does not exist → Register
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          username: trimmedLogin,
          password: hashedPassword
        }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: user.id,
          username: user.username
        },
        token
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};