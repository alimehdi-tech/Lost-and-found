import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Update user's last seen timestamp
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { status = 'online' } = await request.json();

    // Update user's last seen and status
    await User.findByIdAndUpdate(session.user.id, {
      lastSeen: new Date(),
      status: status,
      isOnline: status === 'online'
    });

    return NextResponse.json({
      message: 'Status updated successfully',
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

// Get user status
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get specific user's status
      const user = await User.findById(userId).select('name avatar lastSeen status isOnline');
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Determine if user is online (last seen within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = user.lastSeen && user.lastSeen > fiveMinutesAgo && user.status === 'online';

      return NextResponse.json({
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          lastSeen: user.lastSeen,
          status: user.status,
          isOnline: isOnline
        }
      });
    } else {
      // Get all online users (for admin or general stats)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const onlineUsers = await User.find({
        lastSeen: { $gte: fiveMinutesAgo },
        status: 'online'
      }).select('name avatar lastSeen status');

      return NextResponse.json({
        onlineUsers,
        count: onlineUsers.length
      });
    }

  } catch (error) {
    console.error('Error getting user status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

// Set user offline
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Set user offline
    await User.findByIdAndUpdate(session.user.id, {
      status: 'offline',
      isOnline: false,
      lastSeen: new Date()
    });

    return NextResponse.json({
      message: 'User set to offline',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error setting user offline:', error);
    return NextResponse.json(
      { error: 'Failed to set offline' },
      { status: 500 }
    );
  }
}
