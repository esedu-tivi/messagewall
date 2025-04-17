const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const messageRoutes = require('./routes/messageRoutes');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const pollRoutes = require('./routes/pollRoutes');
const roleRoutes = require('./routes/roleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();


app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000','http://localhost:80'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const BASE_URL = process.env.BASE_URL;

app.use(`${BASE_URL}/auth`, authRoutes);
app.use(`${BASE_URL}/events`, eventRoutes);
app.use(`${BASE_URL}/messages`, messageRoutes);
app.use(`${BASE_URL}/users`, userRoutes);
app.use(`${BASE_URL}/polls`, pollRoutes);
app.use(`${BASE_URL}/roles`, roleRoutes);
app.use(`${BASE_URL}/notifications`, notificationRoutes);

// Serve static files in uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
