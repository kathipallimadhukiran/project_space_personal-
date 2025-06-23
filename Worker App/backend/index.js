require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AnalyticsSummary = require('./models/AnalyticsSummary');
const crypto = require('crypto');
const Report = require('./models/Report');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

const app = express();
app.use(cors());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Only use bodyParser.json() for routes that expect JSON, not for file uploads
app.use('/login', bodyParser.json());
app.use('/signup', bodyParser.json());
app.use('/send-otp', bodyParser.json());
app.use('/verify-otp', bodyParser.json());
app.use('/services', bodyParser.json());
app.use('/api/bookings', bodyParser.json());
app.use('/api/reviews', bodyParser.json());
// Do NOT use for /profile PUT (file upload)

// Connect to MongoDB
const mongoUri = 'mongodb+srv://manieerr:nCVBWRvTFgEYGeQV@cluster0.8qmqc77.mongodb.net/expoapp?retryWrites=true&w=majority&appName=Cluster0';
if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  phone: String,
  serviceCategory: String,
  experienceLevel: String,
  availabilityStatus: String,
  profilePicture: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
  },
  bio: String,
  otp: String,
  otpExpires: Date,
});
const User = mongoose.model('User', userSchema);

// Service schema
const serviceSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  phoneNumber: String, // Add phone number field
  title: { type: String, required: true },
  description: String,
  price: Number,
  category: { type: String, default: 'General' },
  priceType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
  availability: { type: String, default: 'Mon-Fri, 9 AM-5 PM' },
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

// Nodemailer transporter (configure for your email)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'manieerr@gmail.com',
    pass: process.env.EMAIL_PASS || 'bgol bzto xvib lvio',
  },
});

// Multer setup for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Ensure keys directory exists
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

// Load or generate RSA keys
const PUBLIC_KEY_PATH = path.join(__dirname, 'keys', 'public.pem');
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.pem');

let publicKey, privateKey;

try {
  // Try to read existing keys
  publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
} catch (error) {
  // Generate new keys if they don't exist
  console.log('Generating new RSA keys...');
  const { publicKey: pubKey, privateKey: privKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  // Save the keys
  fs.writeFileSync(PUBLIC_KEY_PATH, pubKey);
  fs.writeFileSync(PRIVATE_KEY_PATH, privKey);
  
  publicKey = pubKey;
  privateKey = privKey;
  console.log('RSA keys generated and saved successfully');
}

// Endpoint to serve the public key
app.get('/public-key', (req, res) => {
  res.type('text/plain').send(publicKey);
});

// Helper function to generate OTP email HTML
function generateOtpEmailHtml({ otp, purpose = 'Verification' }) {
  // Determine heading for different OTP purposes
  let heading = 'Verification';
  if (purpose.toLowerCase().includes('login')) heading = 'Login Verification';
  else if (purpose.toLowerCase().includes('password')) heading = 'Password Reset';

  return `
    <div style="max-width:480px;margin:32px auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #eee;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.04);">
      <div style="text-align:center;margin-bottom:18px;">
        <span style="font-size:28px;font-weight:900;letter-spacing:1px;color:#000;">We</span><span style="font-size:28px;font-weight:900;letter-spacing:1px;color:#FF6200;">FixIt</span>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <span style="font-size:20px;font-weight:700;color:#222;">${heading}</span>
      </div>
      <div style="margin-bottom:18px;color:#222;font-size:15px;">Hello,<br><br>We've received a ${heading.toLowerCase()} attempt for your <b>We<span style='color:#FF6200;'>FixIt</span></b> account. To complete the process, please use the following One-Time Password (OTP):</div>
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <div style="background:#f3f4f6;padding:20px 0;width:100%;border-radius:8px;text-align:center;border:1px solid #e5e7eb;">
          <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#222;">${otp}</span>
        </div>
      </div>
      <div style="color:#222;font-size:14px;margin-bottom:0;text-align:center;">This code will expire in 10 minutes. If you did not attempt this, please secure your account immediately by changing your password.</div>
      <div style="margin:24px 0 0 0;padding:14px 18px;background:#fff5f5;border:1px solid #ffb4b4;border-radius:8px;color:#d32f2f;font-size:14px;">
        <b>Security Tip:</b> Never share this code with anyone, including We<span style='color:#FF6200;'>FixIt</span> support.
      </div>
      <div style="margin-top:32px;color:#888;font-size:14px;">
        <div style="margin-bottom:8px;">Best regards,<br><b>The We<span style='color:#FF6200;'>FixIt</span> Security Team</b></div>
        <div style="font-size:12px;color:#aaa;">© 2025 We<span style='color:#FF6200;'>FixIt</span>. All rights reserved.</div>
      </div>
    </div>
  `;
}

// Update sendOtpEmail to use HTML template
const sendOtpEmail = async (email, otp, purpose = 'Verification') => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your ${purpose} OTP`,
      text: `Your OTP for ${purpose.toLowerCase()} is: ${otp}. It will expire in 10 minutes.`,
      html: generateOtpEmailHtml({ otp, purpose }),
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
};

app.post('/signup', async (req, res) => {
  let { email, password, name } = req.body;
  // If encrypted fields are present, decrypt them
  try {
    if (email && email.startsWith('enc:')) {
      const base64Email = email.replace('enc:', '');
      const encEmail = Buffer.from(base64Email, 'base64');
      email = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        encEmail
      ).toString('utf8');
    }
    if (password && password.startsWith('enc:')) {
      const base64Password = password.replace('enc:', '');
      const encPassword = Buffer.from(base64Password, 'base64');
      password = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        encPassword
      ).toString('utf8');
    }
  } catch (err) {
    console.error('Decryption error:', err);
    return res.status(400).json({ message: 'Invalid encrypted data' });
  }
  
  try {
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = new User({ 
      email, 
      password, 
      name,
      isVerified: false // Mark as unverified until email is verified
    });
    
    await user.save();
    
    // Return success response - frontend will handle sending OTP
    res.json({ message: 'Signup successful' });
    
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Send OTP endpoint - used for both signup and login
app.post('/send-otp', async (req, res) => {
  const { email, purpose = 'Verification' } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    const emailSent = await sendOtpEmail(email, otp, purpose);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route - Step 1: Request OTP
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    try {
      await sendOtpEmail(email, otp, 'Login');
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP. Please try again later.' 
      });
    }
    res.json({ 
      success: true, 
      message: 'OTP sent to your email. Please verify to complete login.' 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login. Please try again.' 
    });
  }
});

// Verify OTP route - Step 2: Complete login with OTP
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and OTP are required' 
    });
  }

  try {
    const user = await User.findOne({ email });
    
    // Check if OTP matches and is not expired
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Create a simple session (in production, use JWT or session management)
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    
    // In a real app, store this in Redis or your database
    // For now, we'll just return it
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role || 'worker', // Default to worker if not set
      // Add other non-sensitive user data as needed
    };

    res.json({ 
      success: true, 
      message: 'Login successful',
      token: sessionToken,
      user: userResponse
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during OTP verification' 
    });
  }
});

// Profile routes
app.get('/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const user = await User.findOne({ email }, '-password -otp -otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/profile', (req, res, next) => {
  // Check if this is a multipart/form-data request
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('profilePicture')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  // Accept both JSON and multipart/form-data
  const { email, name, phone, serviceCategory, experienceLevel, availabilityStatus, bio } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  let updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (phone !== undefined) updateFields.phone = phone;
  if (serviceCategory !== undefined) updateFields.serviceCategory = serviceCategory;
  if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel;
  if (availabilityStatus !== undefined) updateFields.availabilityStatus = availabilityStatus;
  if (bio !== undefined) updateFields.bio = bio;
  try {
    // If a new file is uploaded, delete the old one
    if (req.file) {
      const user = await User.findOne({ email });
      if (user && user.profilePicture && user.profilePicture.filename) {
        const oldPath = path.join('uploads', user.profilePicture.filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      // Save absolute URL
      const BASE_URL = 'http://192.168.225.58:5000';
      updateFields.profilePicture = {
        url: `${BASE_URL}/uploads/${req.file.filename}`,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    }
    const user = await User.findOneAndUpdate(
      { email },
      updateFields,
      { new: true, fields: '-password -otp -otpExpires' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// New route for updating only availabilityStatus
app.use('/profile/status', express.json());
app.put('/profile/status', async (req, res) => {
  const { email, availabilityStatus } = req.body;
  console.log('PUT /profile/status:', { email, availabilityStatus });
  if (!email || !availabilityStatus) return res.status(400).json({ message: 'Email and availabilityStatus required' });
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { availabilityStatus },
      { new: true, fields: '-password -otp -otpExpires' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Service routes
app.get('/services', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const services = await Service.find({ userEmail: email });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/services', async (req, res) => {
  const { userEmail, phoneNumber, title, description, price, category, priceType, availability, locationName, locationCoords, images, tags, maxDistance, experienceRequired } = req.body;
  if (!userEmail || !title) return res.status(400).json({ message: 'userEmail and title required' });
  try {
    // Get user's phone number if not provided
    let workerPhoneNumber = phoneNumber;
    if (!workerPhoneNumber) {
      const user = await User.findOne({ email: userEmail });
      if (user && user.phone) {
        workerPhoneNumber = user.phone;
      }
    }
    
    const service = new Service({ 
      userEmail, 
      phoneNumber: workerPhoneNumber,
      title, 
      description, 
      price, 
      category, 
      priceType, 
      availability, 
      locationName, 
      locationCoords, 
      images, 
      tags, 
      maxDistance, 
      experienceRequired 
    });
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/services/:id', async (req, res) => {
  const { id } = req.params;
  console.log('PUT /services/:id', { id, body: req.body }); // Debug log
  // Accept all possible fields from the request body
  const updateFields = {};
  const allowedFields = [
    'title', 'description', 'price', 'category', 'priceType', 'availability',
    'locationName', 'locationCoords', 'images', 'tags', 'maxDistance', 'experienceRequired', 'userEmail'
  ];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updateFields[field] = req.body[field];
  }
  try {
    const service = await Service.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findByIdAndDelete(id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics endpoints
app.get('/analytics', async (req, res) => {
  const { email } = req.query;
  console.log('GET /analytics for email:', email);
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    let summary = await AnalyticsSummary.findOne({ userEmail: email });
    if (!summary) {
      summary = new AnalyticsSummary({ userEmail: email });
      await summary.save();
    }
    console.log('Returning analytics summary:', summary);
    res.json(summary);
  } catch (err) {
    console.error('Error in /analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/analytics/update', express.json(), async (req, res) => {
  const { email, totalBookings, completedBookings, totalEarnings, lastBookingDate, lastLogin, monthlyEarnings, monthlyBookings } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const updateFields = {};
    if (totalBookings !== undefined) updateFields.totalBookings = totalBookings;
    if (completedBookings !== undefined) updateFields.completedBookings = completedBookings;
    if (totalEarnings !== undefined) updateFields.totalEarnings = totalEarnings;
    if (lastBookingDate !== undefined) updateFields.lastBookingDate = lastBookingDate;
    if (lastLogin !== undefined) updateFields.lastLogin = lastLogin;
    if (monthlyEarnings !== undefined) updateFields.monthlyEarnings = monthlyEarnings;
    if (monthlyBookings !== undefined) updateFields.monthlyBookings = monthlyBookings;
    const summary = await AnalyticsSummary.findOneAndUpdate(
      { userEmail: email },
      updateFields,
      { new: true, upsert: true }
    );
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password: send OTP
app.post('/forgot-password', bodyParser.json(), async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();
    await sendOtpEmail(email, otp, 'Password Reset');
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
app.post('/reset-password', bodyParser.json(), async (req, res) => {
  let { email, otp, newPassword } = req.body;
  // Decrypt newPassword if encrypted
  try {
    if (newPassword && newPassword.startsWith('enc:')) {
      const encPassword = Buffer.from(newPassword.replace('enc:', ''), 'base64');
      newPassword = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        encPassword
      ).toString('utf8');
    }
  } catch (err) {
    console.error('Decryption error (reset-password):', err);
    return res.status(400).json({ message: 'Invalid encrypted data' });
  }
  try {
    const user = await User.findOne({ email, otp });
    if (!user || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password: verify current password and set new password
app.post('/change-password', bodyParser.json(), async (req, res) => {
  let { email, currentPassword, newPassword } = req.body;
  // Decrypt passwords if encrypted
  try {
    if (currentPassword && currentPassword.startsWith('enc:')) {
      const encCurrent = Buffer.from(currentPassword.replace('enc:', ''), 'base64');
      currentPassword = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        encCurrent
      ).toString('utf8');
    }
    if (newPassword && newPassword.startsWith('enc:')) {
      const encNew = Buffer.from(newPassword.replace('enc:', ''), 'base64');
      newPassword = crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        encNew
      ).toString('utf8');
    }
  } catch (err) {
    console.error('Decryption error (change-password):', err);
    return res.status(400).json({ message: 'Invalid encrypted data' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/report', express.json(), async (req, res) => {
  const { email, type, details, extra } = req.body;
  if (!email || !type || !details) {
    return res.status(400).json({ message: 'email, type, and details are required' });
  }
  try {
    const report = new Report({ email, type, details, extra });
    await report.save();
    res.json({ message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  const {
    workerEmail,
    customerEmail,
    clientName,
    clientPhone,
    customerPhone,
    serviceName,
    serviceId,
    bookingDate,
    date, // Legacy field
    time, // Legacy field
    location, // Text address
    address = {},
    notes,
    price = 0,
    serviceFee = 0,
    totalAmount = 0,
    paymentStatus = 'pending'
  } = req.body;

  if (!workerEmail || !customerEmail || !clientName || !clientPhone || !serviceName || !serviceId || (!bookingDate && !date)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields. Required: workerEmail, customerEmail, clientName, clientPhone, serviceName, serviceId, and either bookingDate or date' 
    });
  }

  try {
    // If bookingDate is not provided, combine date and time
    const finalBookingDate = bookingDate || new Date(`${date}T${time || '00:00'}`);
    
    const booking = new Booking({
      workerEmail,
      customerEmail,
      clientName,
      clientPhone,
      customerPhone: customerPhone || clientPhone, // Fallback to clientPhone if customerPhone not provided
      serviceName,
      serviceId,
      bookingDate: finalBookingDate,
      date: finalBookingDate, // Set legacy date field
      time: time || '00:00', // Set legacy time field
      location: address.text || location || 'Location not provided',
      address: {
        text: address.text || location || 'Location not provided',
        coordinates: address.coordinates || { lat: 0, lng: 0 }
      },
      notes,
      status: 'Pending',
      price,
      serviceFee,
      totalAmount: totalAmount || (price + serviceFee),
      paymentStatus
    });

    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Get all bookings for a worker or customer
app.get('/api/bookings', async (req, res) => {
  try {
    const { workerEmail, customerEmail } = req.query;
    console.log('Fetching bookings with params:', { workerEmail, customerEmail });
    
    if (!workerEmail && !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Worker email or customer email is required' 
      });
    }

    // Build query based on provided parameters
    const query = {};
    if (workerEmail) query.workerEmail = workerEmail;
    if (customerEmail) query.customerEmail = customerEmail;

    console.log('Querying bookings with:', query);
    const bookings = await Booking.find(query)
      .sort({ bookingDate: 1 })  // Sort by bookingDate in ascending order
      .lean();
    
    console.log('Found bookings:', bookings.length);
    
    // Fetch client names from clinetusers if missing
    const clientEmails = bookings.map(b => b.customerEmail).filter(Boolean);
    const ClinetUserModel = mongoose.models.ClinetUserModel || mongoose.model('ClinetUserModel', new mongoose.Schema({ name: String, email: String }, { collection: 'clinetusers' }));
    const clientUsers = await ClinetUserModel.find({ email: { $in: clientEmails } }).lean();
    const emailToName = {};
    clientUsers.forEach(u => { if (u.email) emailToName[u.email] = u.name; });

    // Fetch service names from services collection if missing
    const serviceIds = bookings.map(b => b.serviceId).filter(Boolean);
    const ServiceModel = mongoose.models.Service || mongoose.model('Service');
    const services = await ServiceModel.find({ _id: { $in: serviceIds } }).lean();
    const idToServiceName = {};
    services.forEach(s => { if (s._id) idToServiceName[s._id.toString()] = s.title; });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      workerEmail: booking.workerEmail,
      customerEmail: booking.customerEmail,
      clientName: booking.clientName || emailToName[booking.customerEmail] || 'Unknown Client',
      clientPhone: booking.clientPhone || booking.customerPhone || 'Not provided',
      customerPhone: booking.customerPhone || booking.clientPhone || 'Not provided',
      serviceName: booking.serviceName || idToServiceName[booking.serviceId] || 'Unknown Service',
      serviceId: booking.serviceId,
      bookingDate: booking.bookingDate || booking.date,
      status: booking.status,
      address: {
        text: booking.address?.text || booking.location || 'Location not provided',
        coordinates: booking.address?.coordinates || { lat: 0, lng: 0 }
      },
      location: booking.location,
      notes: booking.notes || '',
      price: booking.price || 0,
      serviceFee: booking.serviceFee || 0,
      totalAmount: booking.totalAmount || 0,
      paymentStatus: booking.paymentStatus || 'pending',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));
    
    res.json({ success: true, bookings: formattedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: error.message });
  }
});

// Update booking status
// Worker requests to complete a booking
app.post('/api/bookings/:id/request-completion', async (req, res) => {
  try {
    console.log('Requesting completion for booking:', req.params.id);
    
    // First, get the current state of the booking
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      console.error('Booking not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    console.log('Current booking state:', {
      _id: booking._id,
      status: booking.status,
      completionRequested: booking.completionRequested,
      completed: booking.completed,
      updatedAt: booking.updatedAt
    });
    
    // Check if booking is already completed
    if (booking.completed) {
      console.log('Booking is already marked as completed:', booking._id);
      return res.status(400).json({ 
        success: false, 
        message: 'This booking has already been completed' 
      });
    }
    
    // Check if completion is already requested
    if (booking.completionRequested) {
      console.log('Completion already requested for booking:', booking._id);
      return res.status(400).json({ 
        success: false, 
        message: 'Completion already requested for this booking' 
      });
    }
    
    // Update the booking directly using save() to ensure we have the latest version
    booking.completionRequested = true;
    booking.updatedAt = new Date();
    
    try {
      await booking.save({ validateBeforeSave: false });
      console.log('Successfully updated booking:', booking._id);
    } catch (saveError) {
      console.error('Error saving booking:', saveError);
      throw new Error('Failed to save booking changes');
    }
    
    // Fetch the updated booking to return it
    const updatedBooking = await Booking.findById(req.params.id).lean();

    console.log('Successfully updated booking:', {
      id: updatedBooking._id,
      status: updatedBooking.status,
      completionRequested: updatedBooking.completionRequested,
      updatedAt: updatedBooking.updatedAt
    });

    // TODO: Send notification to client

    res.json({ 
      success: true, 
      message: 'Completion request sent to client',
      booking: {
        _id: updatedBooking._id,
        status: updatedBooking.status,
        completionRequested: updatedBooking.completionRequested,
        updatedAt: updatedBooking.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in request-completion endpoint:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to request completion',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Client confirms completion
app.post('/api/bookings/:id/confirm-completion', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.completionRequested) {
      return res.status(400).json({ 
        success: false, 
        message: 'No completion request found for this booking' 
      });
    }

    // Mark as completed
    booking.status = 'Completed';
    booking.completed = true;
    booking.completedAt = new Date();
    booking.completionRequested = false;
    await booking.save();

    // TODO: Send confirmation notification to worker

    res.json({ 
      success: true, 
      message: 'Booking marked as completed',
      booking 
    });
  } catch (error) {
    console.error('Error confirming completion:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm completion' });
  }
});

// Client rejects completion
app.post('/api/bookings/:id/reject-completion', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Reset completion request
    booking.completionRequested = false;
    await booking.save();

    res.json({ 
      success: true, 
      message: 'Completion request rejected',
      booking 
    });
  } catch (error) {
    console.error('Error rejecting completion:', error);
    res.status(500).json({ success: false, message: 'Failed to reject completion' });
  }
});

// Update booking status (general)
app.patch('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    const updateData = { status };
    
    // If marking as completed, set completed flag and timestamp
    if (status.toLowerCase() === 'completed') {
      updateData.completed = true;
      updateData.completedAt = new Date();
    } else if (status.toLowerCase() !== 'completed') {
      // If changing from completed to another status, reset the completed flag
      updateData.completed = false;
      updateData.completedAt = null;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// Seed some test bookings (for development only)
if (process.env.NODE_ENV === 'development') {
  const seedBookings = async () => {
    try {
      const count = await Booking.countDocuments();
      if (count === 0) {
        const testBookings = [
          {
            workerEmail: 'worker@example.com',
            clientName: 'John Doe',
            clientPhone: '1234567890',
            serviceName: 'Plumbing Repair',
            serviceId: 'service1',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            time: '14:00',
            location: '123 Main St, City',
            status: 'Pending',
            notes: 'Leaking faucet in kitchen'
          },
          {
            workerEmail: 'worker@example.com',
            clientName: 'Jane Smith',
            clientPhone: '0987654321',
            serviceName: 'Electrical Work',
            serviceId: 'service2',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            time: '10:30',
            location: '456 Oak Ave, Town',
            status: 'Confirmed',
            notes: 'Install new light fixtures'
          }
        ];
        
        await Booking.insertMany(testBookings);
        console.log('Test bookings seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding test bookings:', error);
    }
  };
  
  // Run after MongoDB connects
  mongoose.connection.once('open', () => {
    seedBookings();
  });
}

// Add review routes
app.get('/api/reviews/worker/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const reviews = await Review.find({ 'worker.email': email })
      .sort({ createdAt: -1 })
      .populate('booking', 'serviceType bookingDate status');
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews/:reviewId/respond', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response, responderId, responderName } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.workerResponse = {
      response,
      respondedAt: new Date(),
      status: 'responded',
      responderId,
      responderName,
      responderRole: 'worker'
    };

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
