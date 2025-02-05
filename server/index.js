require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('./config/winston');
const errorHandler = require('./middleware/errorHandler');
const { validateProfile } = require('./middleware/validators');

// Initialize Express app
const app = express();

// Initialize Firebase Admin with service account
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore
const db = admin.firestore();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Request logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ];
    
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(process.env.PRODUCTION_ORIGIN);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      winston.warn('Origin not allowed:', origin);
      return callback(null, false);
    }
    winston.debug('Origin allowed:', origin);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['Content-Type'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  winston.info({
    message: 'Incoming request',
    method: req.method,
    path: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      winston.warn('No authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    winston.debug('Verifying token:', token.substring(0, 20) + '...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    winston.debug('Token verified, user:', decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (error) {
    winston.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.get('/api/user/profile', authenticateToken, async (req, res, next) => {
  try {
    winston.info('Getting user profile for:', req.user.uid);
    
    const userProfile = await db.collection('user_profiles').doc(req.user.uid).get();
    winston.debug('Profile exists:', userProfile.exists);
    
    if (!userProfile.exists) {
      winston.info('Profile not found');
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const profileData = userProfile.data();
    winston.debug('Retrieved profile:', profileData);
    return res.json(profileData);
  } catch (error) {
    next(error);
  }
});

app.post('/api/user/profile', [authenticateToken, ...validateProfile], async (req, res, next) => {
  try {
    winston.info('Creating user profile for:', req.user.uid);
    winston.debug('Profile data:', req.body);
    
    const existingProfile = await db.collection('user_profiles').doc(req.user.uid).get();
    if (existingProfile.exists) {
      winston.info('Profile already exists, updating instead');
    }
    
    const profileData = {
      ...req.body,
      uid: req.user.uid,
      email: req.user.email,
      created_at: existingProfile.exists ? existingProfile.data().created_at : admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    winston.debug('Saving profile data:', profileData);
    await db.collection('user_profiles').doc(req.user.uid).set(profileData, { merge: true });
    winston.info('Profile saved successfully');
    
    return res.json({ 
      message: existingProfile.exists ? 'Profile updated successfully' : 'Profile created successfully',
      profile: profileData
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/user/role', authenticateToken, async (req, res, next) => {
  try {
    winston.info('Getting user role for:', req.user.uid);
    const user = await admin.auth().getUser(req.user.uid);
    const role = user.customClaims?.role || 'student';
    winston.debug('User role:', role);
    return res.json({ role });
  } catch (error) {
    next(error);
  }
});

// Static file handling
app.use(express.static(path.join(__dirname, '..')));

// Catch-all route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    winston.warn('API route not found:', req.path);
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const filePath = path.join(__dirname, '..', req.path);
  winston.debug('Looking for file:', filePath);
  
  if (fs.existsSync(filePath)) {
    winston.debug('File found, serving:', filePath);
    return res.sendFile(filePath);
  }
  
  winston.debug('File not found, serving index.html');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  winston.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  winston.info('\nRegistered routes:');
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      winston.info(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
    }
  });
});
