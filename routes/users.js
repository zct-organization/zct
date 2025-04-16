const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()
const sql = require('../db.js')


const DEFAULT_AVATAR_URL = 'https://example.com/default-avatar.png'

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const users = await sql`
      SELECT id, username, avatarUrl, created_at FROM users
    `
    res.json({ msg: 'Users fetched successfully', users })
  } catch (err) {
    console.error(err)
    next(err)
  }
})

// Register
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password are required' })
  }

  try {
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `
    if (existing.length > 0) {
      return res.status(400).json({ msg: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await sql`
      INSERT INTO users (username, password, avatarUrl, created_at)
      VALUES (${username}, ${hashedPassword}, ${DEFAULT_AVATAR_URL}, NOW())
    `

    res.status(201).json({ msg: 'Registration successful' })
  } catch (err) {
    console.error(err)
    next(err)
  }
})

// Login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  try {
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `

    if (users.length === 0) {
      return res.status(401).json({ msg: 'Invalid username or password' })
    }

    const user = users[0]
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ msg: 'Invalid username or password' })
    }

    res.json({
      msg: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarurl,
        created_at: user.created_at,
      },
    })
  } catch (err) {
    console.error(err)
    next(err)
  }
})

// Edit user (username and/or avatar)
router.put('/:id', async (req, res, next) => {
  const { username, avatarUrl } = req.body
  const { id } = req.params

  try {
    const updated = await sql`
      UPDATE users
      SET username = COALESCE(${username}, username),
          avatarUrl = COALESCE(${avatarUrl}, avatarUrl)
      WHERE id = ${id}
      RETURNING id, username, avatarUrl
    `

    if (updated.length === 0) {
      return res.status(404).json({ msg: 'User not found' })
    }

    res.json({ msg: 'User updated successfully', user: updated[0] })
  } catch (err) {
    console.error(err)
    next(err)
  }
})

module.exports = router
