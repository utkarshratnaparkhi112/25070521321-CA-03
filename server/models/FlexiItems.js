const mongoose = require('mongoose');

const FlexiItemSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Title is required'], 
        trim: true 
    },
    category: { 
        type: String, 
        required: [true, 'Category is required'],
        enum: ['Operations', 'Analytics', 'Resources', 'General']
    },
    status: { 
        type: String, 
        default: 'Active',
        enum: ['Active', 'Pending', 'Completed']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('FlexiItem', FlexiItemSchema);