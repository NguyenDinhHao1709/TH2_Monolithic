const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_mvp_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, fullname, password, roleid, mid } = req.body;
    if (!username || !fullname || !password) {
      return res.status(400).json({ message: 'Missing required fields: username, fullname, password' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Tự động đảm bảo Role 'normal' (roleid: 2) và MemberShip 'Normal' (mid: 1, score: 10) tồn tại
    await prisma.role.upsert({
      where: { roleid: 2 },
      update: { rolename: 'normal' },
      create: { roleid: 2, rolename: 'normal' }
    });
    await prisma.memberShip.upsert({
      where: { mid: 1 },
      update: { mname: 'Normal', score: 10 },
      create: { mid: 1, mname: 'Normal', score: 10 }
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        username,
        fullname,
        password: hashedPassword,
        roleid: roleid || 2, // Mặc định role là normal (roleid = 2)
        mid: mid || 1        // Mặc định membership là Normal với score = 10 (mid = 1)
      },
      include: {
        role: true,
        membership: true
      }
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: created.uid,
        username: created.username,
        fullname: created.fullname,
        roleid: created.roleid,
        role: created.role.rolename,
        mid: created.mid,
        membership: created.membership ? created.membership.mname : 'Normal',
        score: created.membership ? created.membership.score : 10
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, membership: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        username: user.username,
        roleid: user.roleid,
        rolename: user.role.rolename
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        membership: user.membership ? user.membership.mname : null,
        score: user.membership ? user.membership.score : null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
