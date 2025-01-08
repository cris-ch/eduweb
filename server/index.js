require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Initialize Firestore
const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes - User Management
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    
    // Get additional user data from Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    res.json({ 
      auth: user,
      profile: userData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, phoneNumber, role, ...customClaims } = req.body;
    
    // Update Auth profile
    if (displayName || phoneNumber) {
      await admin.auth().updateUser(req.user.uid, {
        displayName,
        phoneNumber
      });
    }
    
    // Update custom claims if role is provided
    if (role) {
      await admin.auth().setCustomUserClaims(req.user.uid, { role, ...customClaims });
    }
    
    // Update or create Firestore profile
    await db.collection('users').doc(req.user.uid).set({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes - requires admin role
const requireAdmin = async (req, res, next) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    const customClaims = user.customClaims || {};
    
    if (customClaims.role === 'admin' || customClaims.role === 'teacher') {
      next();
    } else {
      res.status(403).json({ error: 'Requires admin privileges' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pageSize = 100, pageToken } = req.query;
    const listUsersResult = await admin.auth().listUsers(parseInt(pageSize), pageToken);
    res.json(listUsersResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    
    // Create auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });
    
    // Set custom claims
    if (role) {
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    }
    
    // Create Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    });
    
    res.status(201).json(userRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign teacher role (admin only)
app.post('/api/users/assign-teacher', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Only admin can assign teachers
    const adminUser = await admin.auth().getUser(req.user.uid);
    const adminClaims = adminUser.customClaims || {};
    
    if (adminClaims.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can assign teachers' });
    }

    // Set teacher role
    await admin.auth().setCustomUserClaims(userId, { role: 'teacher' });
    
    // Update Firestore profile
    await db.collection('users').doc(userId).update({
      role: 'teacher',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    });
    
    res.json({ message: 'Teacher role assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user role
app.get('/api/user/role', authenticateToken, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    const customClaims = user.customClaims || {};
    res.json({ role: customClaims.role || 'student' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
