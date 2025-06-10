import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { validateUMTEmail, generateVerificationToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
const { name, email, password, studentId, phone } = body;
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate UMT email
    if (!validateUMTEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a valid UMT email address (@umt.edu.pk or @student.umt.edu.pk)' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if student ID is already taken (if provided)
    if (studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return NextResponse.json(
          { error: 'Student ID is already registered' },
          { status: 400 }
        );
      }
    }

    // Create verification token
    const verificationToken = generateVerificationToken();

    // Create new user
    const user = new User({
      name,
      email,
      password,
      studentId,
      phone,
      verificationToken,
      isVerified: false // In production, you'd send an email verification
    });

    await user.save();

    // For development, we'll auto-verify the user
    // In production, you would send an email with the verification token
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
