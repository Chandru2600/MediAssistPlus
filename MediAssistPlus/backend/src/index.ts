import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes'; // Import patient routes
import recordingRoutes from './routes/recordingRoutes'; // Import recording routes

dotenv.config();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/recordings', recordingRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
