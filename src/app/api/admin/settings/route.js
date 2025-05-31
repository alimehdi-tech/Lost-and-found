import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

// Settings Schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

const defaultSettings = {
  general: {
    siteName: 'UMT Lost & Found Portal',
    siteDescription: 'A comprehensive lost and found portal for University of Management and Technology',
    contactEmail: 'admin@umt.edu.pk',
    maxImageSize: 5,
    maxImagesPerItem: 4,
    autoArchiveDays: 30
  },
  notifications: {
    emailNotifications: true,
    newItemNotifications: true,
    claimNotifications: true,
    reminderNotifications: true,
    adminNotifications: true
  },
  security: {
    requireEmailVerification: true,
    allowGuestViewing: true,
    moderateNewItems: false,
    autoApproveVerifiedUsers: true
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@umt.edu.pk',
    fromName: 'UMT Lost & Found'
  }
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all settings from database
    const settingsData = await Settings.find({}).lean();
    
    // Convert to object format
    const settings = { ...defaultSettings };
    
    settingsData.forEach(setting => {
      const keys = setting.key.split('.');
      let current = settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = setting.value;
    });

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const settings = await request.json();

    // Flatten settings object and save to database
    const flattenSettings = (obj, prefix = '') => {
      const flattened = {};
      
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenSettings(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
      
      return flattened;
    };

    const flatSettings = flattenSettings(settings);

    // Update or create each setting
    const updatePromises = Object.entries(flatSettings).map(([key, value]) =>
      Settings.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Settings updated successfully' });

  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
