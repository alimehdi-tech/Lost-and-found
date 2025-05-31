import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password, studentId } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, update their role to admin
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      await existingUser.save();
      
      return NextResponse.json({
        message: 'User already exists. Updated role to admin.',
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          studentId: existingUser.studentId
        }
      });
    }

    // Create new admin user
    const adminUser = new User({
      name,
      email,
      password,
      studentId,
      role: 'admin',
      isVerified: true // Auto-verify admin users
    });

    await adminUser.save();

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        studentId: adminUser.studentId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create admin error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email or Student ID already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
