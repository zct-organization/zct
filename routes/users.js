const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const sql = require('../db.js');
const authGuard = require('../middleware/authGuard.js'); // Import the auth guard middleware

const DEFAULT_AVATAR_URL = 'https://example.com/default-avatar.png';

router.get('/', authGuard, async (req, res, next) => {
  try {
    const users = await sql`
      SELECT id, username, "avatarurl", created_at FROM users
    `;
    res.json({ msg: 'Users fetched successfully', users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' });
  }

  try {
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;
    if (existing.length > 0) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, password, "avatarurl", created_at)
      VALUES (${username}, ${hashedPassword}, ${DEFAULT_AVATAR_URL}, NOW())
    `;

    const [newUser] = await sql`
      SELECT id, username, "avatarurl", created_at FROM users WHERE username = ${username}
    `;

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ msg: 'Registration successful', token });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return res.status(401).json({ msg: 'Invalid username or password' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ msg: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      msg: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarurl: user.avatarurl,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.put('/:id', authGuard, async (req, res, next) => {
  const { username, avatarurl } = req.body;
  const { id } = req.params;

  // Optionally: Check if req.user.id matches the id parameter to ensure users can only edit their data.
  if (req.user.id != id) {
    return res.status(403).json({ msg: 'Unauthorized to update this user' });
  }

  try {
    const updated = await sql`
      UPDATE users
      SET username = COALESCE(${username}, username),
          "avatarurl" = COALESCE(${avatarurl}, "avatarurl")
      WHERE id = ${id}
      RETURNING id, username, "avatarurl"
    `;

    if (updated.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User updated successfully', user: updated[0] });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
