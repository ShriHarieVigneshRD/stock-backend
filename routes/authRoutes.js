import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validation function
const validateRegistration = (req, res) => {
    const errors = [];
    const { username, email, password } = req.body;

    // Username validation
    if (typeof username !== "string" || !username.trim()) {
        errors.push("Username is required.");
    } else {
        if (username.length < 3) errors.push("Username must be at least 3 characters.");
        if (username.length > 20) errors.push("Username must be at most 20 characters.");
        if (!username.match(/^[a-zA-Z0-9]+$/)) errors.push("Username can only contain letters and numbers.");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !email.trim()) {
        errors.push("Email is required.");
    } else if (!emailRegex.test(email)) {
        errors.push("Invalid email format.");
    }

    // Password validation
    if (typeof password !== "string" || !password.trim()) {
        errors.push("Password is required.");
    } else {
        if (password.length < 5) errors.push("Password must be at least 5 characters.");
        if (password.length > 25) errors.push("Password must be at most 25 characters.");
    }

    return errors;
};

// Registration Route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input
    const errors = validateRegistration(req, res);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: "User already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", 
            [username, email, hashPassword]);

        return res.status(201).json({ message: "User created successfully." });
    } catch (err) {
        return res.status(500).json(err.message);
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic login validation
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }
        const isMatch = await bcrypt.compare(password, rows[0].password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password." });
        }
        const token = jwt.sign({ id: rows[0].id }, process.env.JWT_KEY, { expiresIn: '3h' });

        return res.status(201).json({ token: token,id:rows[0].id });
    } catch (err) {
        return res.status(500).json(err.message);
    }
});

// Middleware to verify token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: "No token provided." });
        }
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
};

// Authenticated Route for Home
router.get('/home', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

// Authenticated Route for Watchlist
router.get('/watchlist', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

// Authenticated Route for Portfolio
router.get('/portfolio', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

// Authenticated Route for Stockindices
router.get('/stockindices', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.post('/logout', verifyToken, (req, res) => {
    try {
        // Invalidate token on the frontend (server doesn't store tokens)
        return res.status(200).json({ message: "Logged out successfully." });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.get('/details/:indexId', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(200).json({ message: "Authorized to access details page." });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.get('/about', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.get('/history', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User does not exist." });
        }

        return res.status(201).json({ user: rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
});

export default router;