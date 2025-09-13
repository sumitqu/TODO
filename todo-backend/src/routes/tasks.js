const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Helper to emit updated tasks to all clients
async function broadcastTasks(io) {
  const tasks = await Task.find().sort({ createdAt: 1 });
  io.emit('tasks:update', tasks);
}

// Route to get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

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
        // Broadcast updated tasks
        const io = req.app.get('io');
        if (io) await broadcastTasks(io);
    } catch (error) {
        res.status(500).json({ message: 'Error adding task', error });
    }
});

// Route to update a task (toggle done, edit text, etc.)
router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  try {
    const task = await Task.findByIdAndUpdate(id, update, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
    // Broadcast updated tasks
    const io = req.app.get('io');
    if (io) await broadcastTasks(io);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
});

// Route to delete a task
router.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
    // Broadcast updated tasks
    const io = req.app.get('io');
    if (io) await broadcastTasks(io);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
});

// Route to clear all tasks
router.delete('/tasks', async (req, res) => {
  try {
    await Task.deleteMany({});
    res.json({ message: 'All tasks cleared' });
    // Broadcast updated tasks
    const io = req.app.get('io');
    if (io) await broadcastTasks(io);
  } catch (error) {
    res.status(500).json({ message: 'Error clearing tasks', error });
  }
});

// Route to clear completed tasks
router.delete('/tasks/completed', async (req, res) => {
  try {
    await Task.deleteMany({ done: true });
    res.json({ message: 'Completed tasks cleared' });
    // Broadcast updated tasks
    const io = req.app.get('io');
    if (io) await broadcastTasks(io);
  } catch (error) {
    res.status(500).json({ message: 'Error clearing completed tasks', error });
  }
});

module.exports = router;