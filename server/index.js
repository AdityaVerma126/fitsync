const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'fitsync-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitsync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
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
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  date: { type: Date, default: Date.now }
});

const Meal = mongoose.model('Meal', mealSchema);

// Define Event Schema
const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  date: { type: Date, required: true }
});

const Event = mongoose.model('Event', eventSchema);

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
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
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

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
    const { name, calories, protein, carbs, fat } = req.body;
    
    const meal = new Meal({
      userId: req.userId,
      name,
      calories,
      protein,
      carbs,
      fat
    });
    
    await meal.save();
    res.status(201).json(meal);
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
    const { title, description, startTime, endTime, date } = req.body;
    
    const event = new Event({
      userId: req.userId,
      title,
      description,
      startTime,
      endTime,
      date
    });
    
    await event.save();
    res.status(201).json(event);
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
