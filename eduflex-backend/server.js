const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // You had this in package.json, let's use it
const connectDB = require('./config/db'); // We will use this!

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB(process.env.MONGO_URI); // Pass the URI to your function

// Create Express app
const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Routes ---
app.use('/api/auth', require('./routes/authRouters'));
app.use('/api/admin', require('./routes/admin.js')); // Use .js for clarity
app.use('/api/professor', require('./routes/professorRoutes.js'));
app.use('/api/student', require('./routes/studentRoutes.js'));
app.use('/api/courses', require('./routes/courses.js'));
app.use('/api/assignments', require('./routes/assignments.js'));

// Test route
app.get('/', (req, res) => {
  res.send('EduFlex API is running...');
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));