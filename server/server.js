const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Matches your folder 'routes.js' and file 'flexiroutes.js'
const flexiRoutes = require('./routes.js/flexiroutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully via Compass URI'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/flexi', flexiRoutes);

app.listen(PORT, () => {
    console.log(`FLEXI Server running on port ${PORT}`);
});