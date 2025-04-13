const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Define JWT_SECRET - THIS IS THE MISSING PIECE
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Enhanced CORS configuration - place this BEFORE other middleware
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Other middleware
app.use(bodyParser.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next();
});

// Connect to MongoDB with enhanced error handling
async function connectDB() {
  try {
    // Use MongoDB Atlas or a cloud provider instead of localhost
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitsyncproject1';
    
    console.log('Attempting to connect to MongoDB at:', 
      MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : MONGO_URI);
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't exit the process, try to recover
    setTimeout(connectDB, 5000); // Try to reconnect after 5 seconds
  }
}

// Call connectDB and handle initial connection
connectDB().catch(err => {
  console.error('Initial database connection failed:', err);
});

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Define Exercise Schema
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  duration: { type: Number },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Define Meal Schema
const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'breakfast' },
  date: { type: Date, default: Date.now }
});

const Meal = mongoose.model('Meal', mealSchema);

// Define Event Schema
const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  date: { type: Date, required: true },
  type: { type: String },
  completed: { type: Boolean, default: false }
});

const Event = mongoose.model('Event', eventSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token - User not found' });
    }
    
    // Verify token version matches current password version
    const passwordVersion = user.password.substr(-10);
    if (decoded.version && decoded.version !== passwordVersion) {
      return res.status(401).json({ message: 'Token expired - Please login again' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Authentication Routes
// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  next();
};

// Registration route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT token - Use the defined JWT_SECRET
    const passwordVersion = user.password.substr(-10);
    const token = jwt.sign(
      { userId: user._id, version: passwordVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate limiting setup
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many login attempts. Please try again later.' }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    // Validate request body
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token with password version for security
    const passwordVersion = user.password.substr(-10);
    const token = jwt.sign(
      { userId: user._id, version: passwordVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user info and token
    console.log('Login successful for:', email);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to authenticate token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

// User routes
// Add this helper function for database operations
const handleDbOperation = async (operation, errorMessage) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoNetworkError' || 
        error.name === 'MongoServerSelectionError' ||
        error.message.includes('connect')) {
      // Try to reconnect to the database
      await connectDB();
    }
    
    throw error;
  }
};

// Then update your routes to use this helper, for example:
app.get('/api/users/profile', auth, async (req, res) => {
  try {
    const user = await handleDbOperation(
      () => User.findById(req.userId).select('-password'),
      'Error fetching user profile'
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in profile route:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Exercise Routes
app.get('/api/exercises', auth, async (req, res) => {
  try {
    const exercises = await Exercise.find({ userId: req.userId });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/exercises', auth, async (req, res) => {
  try {
    const { name, sets, reps, duration } = req.body;
    
    const exercise = new Exercise({
      userId: req.userId,
      name,
      sets,
      reps,
      duration
    });
    
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/exercises/:id', auth, async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/exercises/:id', auth, async (req, res) => {
  try {
    const exercise = await Exercise.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    res.json({ message: 'Exercise deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Meal Routes
app.get('/api/meals', auth, async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.userId });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/meals', auth, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, mealType, date } = req.body;
    
    const meal = new Meal({
      userId: req.userId,
      name,
      calories,
      protein,
      carbs,
      fat,
      mealType,
      date: date || new Date()
    });
    
    await meal.save();
    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/meals/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    res.json(meal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/meals/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Event Routes
app.get('/api/events', auth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.userId });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/events', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime, date, type, completed } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required fields' });
    }
    
    const event = new Event({
      userId: req.userId,
      title,
      description,
      startTime,
      endTime,
      date: new Date(date),
      type,
      completed: completed || false
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/events/:id', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime, date, type, completed } = req.body;
    
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        title, 
        description, 
        startTime, 
        endTime, 
        date, 
        type,
        completed
      },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/events/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Update the CORS configuration to be more permissive
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this route at the top of your routes for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Make sure this is at the end of your file
app.use((req, res, next) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

// Add a database health check endpoint
app.get('/api/db-health', async (req, res) => {
  try {
    // Check if we can execute a simple command on the database
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ 
      status: 'ok', 
      message: 'Database connection is healthy',
      dbState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection is not healthy',
      error: error.message,
      dbState: mongoose.connection.readyState
    });
    
    // Try to reconnect
    connectDB();
  }
});
