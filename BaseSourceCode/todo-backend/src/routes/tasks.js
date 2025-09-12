const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Route to add a new task
router.post('/tasks', async (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Task text is required' });
    }

    try {
        const newTask = new Task({ text: text.trim(), done: false });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: 'Error adding task', error });
    }
});

module.exports = router;