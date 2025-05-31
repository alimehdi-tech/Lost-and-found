import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const item = await Item.findById(params.id)
      .populate('postedBy', 'name email studentId')
      .lean();

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });

  } catch (error) {
    console.error('Item GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { action, ...updateData } = await request.json();

    let updateFields = {};

    switch (action) {
      case 'resolve':
        updateFields = { 
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: session.user.id
        };
        break;
      
      case 'archive':
        updateFields = { 
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: session.user.id
        };
        break;
      
      case 'activate':
        updateFields = { 
          status: 'active',
          resolvedAt: null,
          archivedAt: null
        };
        break;
      
      case 'approve':
        updateFields = { 
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: session.user.id
        };
        break;
      
      case 'reject':
        updateFields = { 
          isApproved: false,
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: session.user.id
        };
        break;
      
      case 'feature':
        updateFields = { isFeatured: true };
        break;
      
      case 'unfeature':
        updateFields = { isFeatured: false };
        break;
      
      case 'update':
        // Allow updating specific fields
        const allowedFields = [
          'title', 'description', 'category', 'location', 
          'contactInfo', 'status', 'isApproved', 'isFeatured'
        ];
        updateFields = {};
        
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updateFields[field] = updateData[field];
          }
        });
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const item = await Item.findByIdAndUpdate(
      params.id,
      { ...updateFields, updatedAt: new Date() },
      { new: true }
    ).populate('postedBy', 'name email studentId');

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Item updated successfully',
      item 
    });

  } catch (error) {
    console.error('Item PATCH error:', error);
    
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

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const item = await Item.findByIdAndDelete(params.id);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Item deleted successfully' 
    });

  } catch (error) {
    console.error('Item DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
