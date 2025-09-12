const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    done: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    due: {
        type: Date,
        default: null
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;