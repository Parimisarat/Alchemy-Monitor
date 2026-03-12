const express = require('express');
const cors = require('cors');
const path = require('path');
const monitor = require('./monitor');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for status
app.get('/api/status', (req, res) => {
    res.json(monitor.getStatus());
});

// Serve the dashboard
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Alchemy Monitor running on http://localhost:${PORT}`);
});
