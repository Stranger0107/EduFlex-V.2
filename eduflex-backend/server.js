const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB(process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use(express.json());

// ✅ CORRECT static file serving (ONLY THIS)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/authRouters'));
app.use('/api/admin', require('./routes/admin.js'));
app.use('/api/professor', require('./routes/professorRoutes.js'));
app.use('/api/student', require('./routes/studentRoutes.js'));
app.use('/api/courses', require('./routes/courses.js'));
app.use('/api/assignments', require('./routes/assignments.js'));
app.use('/api/quizzes', require('./routes/quizRoutes.js'));
// Mount notification routes
console.log('Mounting notification routes at /api/notification');
app.use('/api/notification', require('./routes/notification.js'));

// Test route
app.get('/', (req, res) => {
  res.send('EduFlex API is running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
