// Script to create admin user
// Run this with: node scripts/create-admin.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Validate UMT email domain
        return email.endsWith('@umt.edu.pk') || email.endsWith('@student.umt.edu.pk');
      },
      message: 'Please use a valid UMT email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details
    const adminData = {
      name: 'Abdullah',
      email: 's2024376029@umt.edu.pk',
      password: 'admin123', // You should change this password after first login
      studentId: 's2024376029',
      role: 'admin',
      isVerified: true
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminData.email });
    
    if (existingUser) {
      console.log('User already exists. Updating role to admin...');
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      await existingUser.save();
      console.log('✅ User role updated to admin successfully!');
    } else {
      // Create new admin user
      const adminUser = new User(adminData);
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\nAdmin User Details:');
    console.log('Name:', adminData.name);
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role: admin');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();
