const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { getMaxListeners } = require('events');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
    }
  }
});

const app = express();
// Server configuration with environment variables and fallbacks
const PORT = process.env.PORT || 1000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const LOCAL_IP = '192.168.125.111'; // Local IP for constructing accessible URLs

// MongoDB connection
mongoose.connect('mongodb+srv://manieerr:nCVBWRvTFgEYGeQV@cluster0.8qmqc77.mongodb.net/expoapp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB connected');
  
  // Drop the problematic index
  try {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      if (collection.collectionName === 'clinetusers') {
        await collection.dropIndex('e_1');
        console.log('Successfully dropped problematic index');
        break;
      }
    }
  } catch (error) {
    if (error.code !== 27) { // 27 is the error code for index not found
      console.error('Error handling index:', error);
    }
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  avatar: { type: String },
  location: {
    address: { type: String },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  paymentMethods: [{
    cardType: String,
    last4: String,
    exp: String,
    isDefault: Boolean,
    providerId: String
  }],
  notifications: [{
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  otp: String,
  otpExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'clinetusers' });
const User = mongoose.model('User', userSchema);

// Worker Schema
const workerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'Unavailable', 'Busy'],
    default: 'Available' 
  },
  bio: { type: String },
  experienceLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Expert'],
    default: 'Beginner' 
  },
  serviceCategory: { type: String, required: true },
  profilePicture: {
    url: { type: String },
    filename: { type: String },
    mimetype: { type: String },
    size: { type: Number }
  },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'workers' });

const Worker = mongoose.model('Worker', workerSchema,'users');

// Temporary route to list all workers (for debugging)
app.get('/api/client/workers', async (req, res) => {
  try {
    const workers = await Worker.find({}, 'email name');
    res.json({ success: true, workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, message: 'Error fetching workers' });
  }
});

// Get worker by email
app.get('/api/client/worker/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching worker with email:', email);
    
    // First try to find by exact email match
    let worker = await Worker.findOne({ email: email.trim().toLowerCase() });
    
    // If not found, try case-insensitive search
    if (!worker) {
      console.log('Exact match not found, trying case-insensitive search');
      worker = await Worker.findOne({ 
        email: { $regex: new RegExp('^' + email.trim() + '$', 'i') } 
      });
    }
    
    if (!worker) {
      console.log('Worker not found in database');
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found',
        searchedEmail: email
      });
    }
    
    console.log('Found worker:', worker.email);
    
    // Return worker data without sensitive information
    const workerData = {
      _id: worker._id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      availabilityStatus: worker.availabilityStatus,
      bio: worker.bio,
      experienceLevel: worker.experienceLevel,
      serviceCategory: worker.serviceCategory,
      profilePicture: worker.profilePicture,
      averageRating: worker.averageRating,
      totalRatings: worker.totalRatings,
      createdAt: worker.createdAt
    };
    
    console.log('Sending worker data:', workerData);
    res.json({ success: true, worker: workerData });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  // Keep both booking and bookingId for backward compatibility
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  client: {
    id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      default: new mongoose.Types.ObjectId()
    },
    name: { 
      type: String, 
      required: true,
      default: 'Anonymous'
    },
    email: { 
      type: String, 
      required: true,
      default: 'unknown@example.com'
    }
  },
  worker: {
    id: { 
      type: String, 
      required: true,
      default: 'unknown-worker-id'
    },
    name: { 
      type: String, 
      required: true,
      default: 'Worker'
    },
    email: { 
      type: String, 
      required: false, // Made optional
      default: 'worker@example.com'
    }
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  review: { 
    type: String, 
    required: true, 
    trim: true 
  },
  workerResponse: {
    response: { 
      type: String, 
      trim: true,
      default: ''
    },
    respondedAt: { 
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'responded'],
      default: 'pending'
    },
    // Additional fields for response
    responderId: {
      type: String,
      default: ''
    },
    responderName: {
      type: String,
      default: ''
    },
    responderRole: {
      type: String,
      enum: ['worker', 'admin'],
      default: 'worker'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Review = mongoose.model('Review', reviewSchema,'reviews');

// Add Worker (users collection) model
const WorkerUser = mongoose.model('WorkerUser', userSchema, 'users');

const serviceSchema = new mongoose.Schema({
  userEmail: String,
  title: String,
  description: String,
  price: Number,
  category: String,
  priceType: String,
  availability: String,
  locationName: String,
  locationCoords: {
    lat: Number,
    lng: Number,
  },
  images: [String],
  tags: [String],
  maxDistance: Number,
  experienceRequired: String,
});
const Service = mongoose.model('Service', serviceSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  workerId: { type: String, required: true },
  workerEmail: { type: String, required: true },
  customerId: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  serviceType: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending' 
  },
  address: {
    text: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  notes: String,
  price: { type: Number, required: true },
  serviceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending' 
  },
  completionRequested: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  completionRequestedAt: { type: Date },
  cancellationReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: err.code
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({
      success: false,
      message: err.message || 'An error occurred',
      error: 'UPLOAD_ERROR'
    });
  }
  next();
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'manieerr@gmail.com',
    pass: 'bgol bzto xvib lvio',
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Signup API
app.post('/api/clientsignup', async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await User.create({ email, password, otp, otpExpires });
  await transporter.sendMail({
    from: 'WeFixIt Support <manieerr@gmail.com>',
    to: email,
    subject: '🔐 Your WeFixIt Account Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></h1>
          <h2 style="color: #1f2937;">Verify Your Email Address</h2>
        </div>
        <p>Hello,</p>
        <p>Thank you for creating an account with <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span>. To complete your registration, please use the following One-Time Password (OTP):</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. Please do not share this code with anyone for security reasons.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Best regards,<br>The <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> Team</p>
          <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span>. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
      Verify Your WeFixIt Account
      =========================

      Hello,

      Thank you for creating an account with WeFixIt. To complete your registration, please use the following One-Time Password (OTP):

      ${otp}

      This code will expire in 10 minutes. Please do not share this code with anyone for security reasons.

      If you didn't request this code, you can safely ignore this email.

      Best regards,
      The WeFixIt Team
      
      © ${new Date().getFullYear()} WeFixIt. All rights reserved.
    `
  });
  res.json({ message: 'OTP sent to email' });
});

// Login API (send OTP)
app.post('/api/clientlogin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await transporter.sendMail({
    from: 'WeFixIt Security <manieerr@gmail.com>',
    to: email,
    subject: '🔒 Your WeFixIt Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></h1>
          <h2 style="color: #1f2937;">Login Verification</h2>
        </div>
        <p>Hello,</p>
        <p>We've received a login attempt for your <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> account. To complete the login, please use the following One-Time Password (OTP):</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not attempt to log in, please secure your account immediately by changing your password.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #b91c1c; font-weight: 500;">Security Tip: Never share this code with anyone, including <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> support.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Best regards,<br>The <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> Security Team</p>
          <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span>. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
      WeFixIt Login Verification
      =======================

      Hello,

      We've received a login attempt for your WeFixIt account. To complete the login, please use the following One-Time Password (OTP):

      ${otp}

      This code will expire in 10 minutes. If you did not attempt to log in, please secure your account immediately by changing your password.

      SECURITY TIP: Never share this code with anyone, including WeFixIt support.

      Best regards,
      The WeFixIt Security Team
      
      © ${new Date().getFullYear()} WeFixIt. All rights reserved.
    `
  });
  res.json({ message: 'OTP sent to email' });
});

// OTP Verification API
app.post('/api/clientverify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, otp });
  if (!user || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.otp = null;
  user.otpExpires = null;
  await user.save();
  res.json({ message: 'OTP verified' });
});

// Forgot Password (send OTP)
app.post('/api/clientforgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await transporter.sendMail({
    from: 'WeFixIt Security <manieerr@gmail.com>',
    to: email,
    subject: '🔑 Reset Your WeFixIt Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></h1>
          <h2 style="color: #1f2937;">Password Reset Request</h2>
        </div>
        <p>Hello,</p>
        <p>We received a request to reset the password for your <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> account. Use the following verification code to proceed:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #166534; font-weight: 500;">For your security, never share this code with anyone, including <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> support.</p>
        </div>
        <p>If you need assistance, please contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Best regards,<br>The <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span> Security Team</p>
          <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} <span style="font-weight: 500;"><span style="color: #000000;">We</span><span style="color: #FF6B35;">FixIt</span></span>. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
      WeFixIt Password Reset
      ===================

      Hello,

      We received a request to reset the password for your WeFixIt account. Use the following verification code to proceed:

      ${otp}

      This code will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.

      SECURITY: Never share this code with anyone, including WeFixIt support.

      If you need assistance, please contact our support team.

      Best regards,
      The WeFixIt Security Team
      
      © ${new Date().getFullYear()} WeFixIt. All rights reserved.
    `
  });
  res.json({ message: 'OTP sent to email' });
});

// Reset Password
app.post('/api/clientreset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email, otp });
  if (!user || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.password = newPassword;
  user.otp = null;
  user.otpExpires = null;
  await user.save();
  res.json({ message: 'Password reset successful' });
});

// Get all services
app.get('/api/clientservices', async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

// Update user location
app.post('/api/clientupdate-location', async (req, res) => {
  const { email, address, lat, lng } = req.body;
  if (!email || lat == null || lng == null) return res.status(400).json({ message: 'Missing required fields' });
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { 'location.address': address, 'location.coordinates.lat': lat, 'location.coordinates.lng': lng, updatedAt: new Date() } },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Location updated', user });
});

// --- Account Page Integration Endpoints ---

// Get user profile
app.get('/api/clientuser/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Upload profile picture endpoint
app.post('/api/clientuser/:id/upload', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      // Clean up the uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user already has an avatar and it's not the default one, delete the old file
    if (user.avatar && !user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(__dirname, user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/profile-pictures/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({ 
      success: true, 
      avatarUrl: `http://${LOCAL_IP}:${PORT}${avatarPath}` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up the uploaded file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
});

// Edit user profile
app.put('/api/clientuser/:email', async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updateData = { 
      ...(name && { name }), 
      ...(phone && { phone }), 
      ...(avatar && { avatar }),
      updatedAt: Date.now() 
    };
    
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If avatar is being updated to a new URL and old one was a local file, delete the old file
    if (avatar && user.avatar && !user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(__dirname, user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar.startsWith('http') ? user.avatar : `http://${LOCAL_IP}:${PORT}${user.avatar}`
      } 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update user',
      error: error.code || 'UPDATE_ERROR' 
    });
  }
});

// Delete user account
app.delete('/api/clientuser/:email', async (req, res) => {
  const user = await User.findOneAndDelete({ email: req.params.email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Account deleted' });
});

// ... (rest of the code remains the same)
// Get bookings for user
app.get('/api/clientbookings', async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ message: 'User email is required' });
    }
    
    // Find all bookings where the user is either the customer or worker
    const bookings = await Booking.find({
      $or: [
        { customerEmail: user },
        { workerEmail: user }
      ]
    }).sort({ bookingDate: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get reviews for user
// Create a new booking
app.post('/api/clientbookings', async (req, res) => {
  try {
    const {
      serviceId,
      workerId,
      workerEmail,
      customerId,
      customerEmail,
      customerPhone,
      serviceType,
      bookingDate,
      address,
      notes,
      price,
      serviceFee,
      totalAmount
    } = req.body;

    // Validate required fields
    if (!serviceId || !workerId || !workerEmail || !customerId || !customerEmail || 
        !customerPhone || !serviceType || !bookingDate || !address || !price || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate endDate (2 hours after bookingDate)
    const start = new Date(bookingDate);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    // Check for overlapping bookings for this worker
    const overlap = await Booking.findOne({
      workerId,
      $or: [
        { bookingDate: { $lt: end }, endDate: { $gt: start } }
      ]
    });
    if (overlap) {
      return res.status(409).json({ message: 'This time slot is not available. Please select a different time.' });
    }

    // Create new booking
    const booking = new Booking({
      serviceId,
      workerId,
      workerEmail,
      customerId,
      customerEmail,
      customerPhone,
      serviceType,
      bookingDate: start,
      endDate: end,
      address,
      notes,
      price,
      serviceFee: serviceFee || 0,
      totalAmount
    });

    await booking.save();

    // Update user's bookings
    // Using findOneAndUpdate with email since we're using email as ID
    await User.findOneAndUpdate(
      { email: customerEmail },
      { $push: { bookings: booking._id } }
    );
    await WorkerUser.findByIdAndUpdate(
      workerId, 
      { $push: { bookings: booking._id } }
    );

    // Send confirmation email (you can implement this)
    // await sendBookingConfirmation(booking);


    res.status(201).json({ 
      message: 'Booking created successfully', 
      bookingId: booking._id 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Request completion of a booking (called by worker)
app.post('/api/clientbookings/:bookingId/request-completion', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow requesting completion for in-progress bookings
    if (booking.status !== 'in-progress') {
      return res.status(400).json({ 
        message: 'Can only request completion for in-progress bookings' 
      });
    }

    // Update booking with completion request
    booking.completionRequested = true;
    booking.completionRequestedAt = new Date();
    booking.updatedAt = new Date();
    
    await booking.save();
    
    // TODO: Send notification to client
    
    res.json({ 
      message: 'Completion requested successfully',
      booking 
    });
  } catch (error) {
    console.error('Error requesting completion:', error);
    res.status(500).json({ 
      message: 'Error requesting completion', 
      error: error.message 
    });
  }
});

// Update booking status
app.patch('/api/clientbookings/:bookingId/status', async (req, res) => {
  console.log('Updating booking status:', req.body);
  try {
    const { bookingId } = req.params;
    const { status, confirmCompletion, cancellationReason } = req.body;

    if (!['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    // Handle completion confirmation
    let justCompleted = false;
    if (status === 'completed' || confirmCompletion === true) {
      updateData.completed = true;
      updateData.completedAt = new Date();
      updateData.completionRequested = false;
      justCompleted = true;
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    console.log('Booking status updated:', booking.status);
    console.log('Just completed:', justCompleted);
    // If just completed, generate and send invoice
    if (justCompleted) {
      try {
        console.log('Generating invoice for booking:', booking);
        // Fetch customer and worker info
        const customer = await User.findOne({ email: booking.customerEmail });
        const worker = await WorkerUser.findOne({ email: booking.workerEmail });
        // Generate PDF invoice
        const doc = new PDFDocument();
        const invoiceDir = path.join(__dirname, 'uploads', 'invoices');
        if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });
        const invoicePath = path.join(invoiceDir, `invoice-${booking._id}.pdf`);
        doc.pipe(fs.createWriteStream(invoicePath));
        // Header
        doc.fontSize(22).text('WeFixIt - Service Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Invoice #: ${booking._id}`);
        doc.moveDown();
        // Customer Info
        doc.fontSize(14).text('Billed To:', { underline: true });
        doc.fontSize(12).text(`${customer?.name || booking.customerEmail}`);
        doc.text(`${booking.customerEmail}`);
        if (customer?.phone) doc.text(`Phone: ${customer.phone}`);
        doc.moveDown();
        // Service Info
        doc.fontSize(14).text('Service Details:', { underline: true });
        doc.fontSize(12).text(`Service: ${booking.serviceType}`);
        doc.text(`Worker: ${worker?.name || booking.workerEmail}`);
        doc.text(`Worker Email: ${booking.workerEmail}`);
        doc.text(`Booking Date: ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : ''}`);
        if (booking.address?.text) doc.text(`Service Address: ${booking.address.text}`);
        doc.moveDown();
        // Cost Info
        doc.fontSize(14).text('Cost Breakdown:', { underline: true });
        doc.fontSize(12).text(`Service Fee: $${booking.serviceFee}`);
        doc.text(`Price: $${booking.price}`);
        doc.text(`Total Amount: $${booking.totalAmount}`);
        doc.moveDown();
        doc.text('Thank you for choosing WeFixIt!', { align: 'center' });
        doc.end();
        // Wait for PDF to finish
        await new Promise(resolve => doc.on('finish', resolve));
        // Send email with invoice
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'manieerr@gmail.com',
            pass: 'bgol bzto xvib lvio'
          }
        });
        let mailOptions = {
          from: 'WeFixIt <no-reply@wefixit.com>',
          to: booking.customerEmail,
          subject: 'Your Service Invoice from WeFixIt',
          text: 'Thank you for using WeFixIt! Please find your invoice attached.',
          attachments: [
            {
              filename: `invoice-${booking._id}.pdf`,
              path: invoicePath
            }
          ]
        };
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.error('Failed to generate/send invoice:', err);
        // Don't fail the main request if invoice fails
      }
    }

    res.json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Get bookings for a user
app.get('/api/clientbookings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ 
      $or: [
        { customerId: userId },
        { workerId: userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get bookings for a user with optional status filter
app.get('/api/clientbookings/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.query;
    
    let query = { 
      $or: [
        { customerEmail: email },
        { workerEmail: email }
      ]
    };
    
    // If status is provided, filter by status
    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }
    
    // Include all necessary fields in the response
    const bookings = await Booking.find(query)
      .sort({ bookingDate: -1 })
      .select('_id serviceType workerId workerEmail customerId customerEmail customerPhone bookingDate address notes price serviceFee totalAmount status paymentStatus completionRequested completed completedAt completionRequestedAt createdAt')
      .populate('serviceId', 'title') // Populate service details if needed
      .populate('workerId', 'name email phone') // Populate worker details
      .lean();
    
    // Ensure all bookings have the required fields with default values
    const normalizedBookings = bookings.map(booking => ({
      ...booking,
      completionRequested: booking.completionRequested || false,
      completed: booking.completed || false,
      completedAt: booking.completedAt || null,
      completionRequestedAt: booking.completionRequestedAt || null
    }));
    
    res.json(normalizedBookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Update booking status
app.put('/api/clientbookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Get reviews for user
app.get('/api/clientreviews', async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ message: 'User email is required' });
    }
    const reviews = await Review.find({ 'client.email': user });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending' 
  },
  transactionId: String,
  paymentDate: { type: Date, default: Date.now },
  receiptUrl: String
});

const Payment = mongoose.model('Payment', paymentSchema, 'payments');

// Get payments for user
app.get('/api/clientpayments', async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ message: 'User email is required' });
    }
    const payments = await Payment.find({ userEmail: user });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// Fetch worker info from 'users' collection by email
app.get('/api/clientworker/:email', async (req, res) => {
  const worker = await WorkerUser.findOne({ email: req.params.email });
  if (!worker) return res.status(404).json({ message: 'Worker not found' });
  res.json(worker);
});

// Create or update a review for a booking
app.post('/api/clientreviews', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Received review submission:', JSON.stringify(req.body, null, 2));
    
    const { booking, bookingId: bookingIdFromBody, client, worker, rating, review } = req.body;
    
    // Use bookingId from body or fallback to booking field
    const bookingId = bookingIdFromBody || booking;
    
    if (!bookingId) {
      console.error('Booking ID is required');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        receivedData: req.body
      });
    }

    if (!client || !client.email) {
      console.error('Client email is required');
      return res.status(400).json({
        success: false,
        message: 'Client email is required',
        receivedData: req.body
      });
    }

    if (!worker || !worker.email) {
      console.error('Worker email is required');
      return res.status(400).json({
        success: false,
        message: 'Worker email is required',
        receivedData: req.body
      });
    }

    if (!rating) {
      console.error('Rating is required');
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
        receivedData: req.body
      });
    }

    if (!review) {
      console.error('Review is required');
      return res.status(400).json({
        success: false,
        message: 'Review is required',
        receivedData: req.body
      });
    }

    // Check if the booking exists
    let bookingRecord;
    try {
      bookingRecord = await Booking.findById(bookingId);
      if (!bookingRecord) {
        console.error('Booking not found:', bookingId);
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          bookingId
        });
      }
    } catch (error) {
      console.error('Error finding booking:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
        error: error.message
      });
    }

    // Check if review already exists for this booking
    let existingReview;
    try {
      // Find review for this specific booking by this client
      existingReview = await Review.findOne({ 
        'bookingId': bookingId,  // Use bookingId to match the unique index
        'client.email': client.email,
        'worker.id': worker.id
      });
      
      if (existingReview) {
        // Update existing review
        existingReview.rating = Number(rating);
        existingReview.review = review.toString();
        existingReview.updatedAt = new Date();
        
        await existingReview.save();
        
        return res.status(200).json({
          success: true,
          message: 'Review updated successfully',
          review: existingReview,
          isUpdated: true
        });
      }
    } catch (error) {
      console.error('Error checking for existing review:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking for existing review',
        error: error.message
      });
    }

    // Create new review if none exists
    try {
      // Ensure bookingId is a valid ObjectId
      const bookingObjectId = new mongoose.Types.ObjectId(bookingId);
      
      const newReview = new Review({
        booking: bookingObjectId,
        bookingId: bookingObjectId,
        client: {
          id: client.id || new mongoose.Types.ObjectId(),
          name: client.name || 'Anonymous',
          email: client.email
        },
        worker: {
          id: worker.id || new mongoose.Types.ObjectId(),
          name: worker.name || 'Worker',
          email: worker.email
        },
        rating: Number(rating),
        review: review.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newReview.save();
      // Update the booking to mark as reviewed (avoid full validation)
      await Booking.updateOne(
        { _id: bookingRecord._id },
        { $set: { isReviewed: true, reviewId: newReview._id } }
      );
      
      console.log('Review submitted successfully:', newReview);
      
      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review: newReview,
        isUpdated: false
      });
    } catch (error) {
      console.error('Error saving review:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error saving review', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error in review submission:', error);
    res.status(500).json({ 
      success: false,
      message: 'Unexpected server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get reviews for a worker by email
app.get('/api/clientreviews/worker/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Fetching reviews for worker email: ${normalizedEmail}`);
    
    // Find all reviews for this worker's email
    const reviews = await Review.find({ 
      'worker.email': { 
        $regex: new RegExp('^' + normalizedEmail + '$', 'i') 
      }
    })
    .populate('client', 'name email') // Populate client details
    .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`Found ${reviews.length} reviews for worker email: ${normalizedEmail}`);
    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching worker reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reviews' 
    });
  }
});

// Get reviews for a worker by ID (keeping this for backward compatibility)
app.get('/api/clientreviews/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({ 'worker.id': req.params.workerId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add worker response to review
app.put('/api/clientreviews/:id/response', async (req, res) => {
  try {
    const { 
      response, 
      responderId, 
      responderName, 
      role = 'worker' 
    } = req.body;
    
    if (!response || !responderId || !responderName) {
      return res.status(400).json({ 
        message: 'Response, responderId, and responderName are required' 
      });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update the review with the response
    review.workerResponse = {
      response: response.trim(),
      respondedAt: new Date(),
      status: 'responded',
      responderId,
      responderName,
      responderRole: role
    };

    await review.save();
    
    // Send notification to the client about the response
    // This is a placeholder - implement your notification logic here
    
    res.json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get review for a specific booking
app.get('/api/clientbookings/:bookingId/review', async (req, res) => {
  try {
    const review = await Review.findOne({ booking: req.params.bookingId });
    if (!review) {
      return res.status(404).json({ message: 'No review found for this booking' });
    }
    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint for network connectivity
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'pong' }));

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Accessible at http://${LOCAL_IP}:${PORT}`);
}); 