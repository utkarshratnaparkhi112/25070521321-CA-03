const express = require('express');
const router = express.Router();
const FlexiItem = require('../models/FlexiItems');
const user = require('../models/user');

// ==========================================
// 1. AUTHENTICATION ROUTES (Signup & Login)
// ==========================================

// @route   POST /api/flexi/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: { name: newUser.name, email: newUser.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/flexi/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. FULL CRUD ROUTES (Get, Post, Put, Delete)
// ==========================================

// @route   GET /api/flexi (Read all items)
router.get('/', async (req, res) => {
    try {
        const items = await FlexiItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/flexi (Create new item)
router.post('/', async (req, res) => {
    try {
        const { title, category, status } = req.body;
        const newItem = new FlexiItem({ title, category, status });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// @route   PUT /api/flexi/:id (Update existing item)
router.put('/:id', async (req, res) => {
    try {
        const { title, category, status } = req.body;
        const updatedItem = await FlexiItem.findByIdAndUpdate(
            req.params.id,
            { title, category, status },
            { new: true }
        );
        if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// @route   DELETE /api/flexi/:id (Delete item)
router.delete('/:id', async (req, res) => {
    try {
        const removedItem = await FlexiItem.findByIdAndDelete(req.params.id);
        if (!removedItem) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;