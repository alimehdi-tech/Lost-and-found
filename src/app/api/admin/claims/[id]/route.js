import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Claim from '@/models/Claim';
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

    const claim = await Claim.findById(params.id)
      .populate('claimant', 'name email studentId phone')
      .populate({
        path: 'item',
        select: 'title description type category location images postedBy',
        populate: {
          path: 'postedBy',
          select: 'name email'
        }
      })
      .lean();

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ claim });

  } catch (error) {
    console.error('Claim GET error:', error);
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

    const { action, reason } = await request.json();

    let updateFields = {};
    let itemUpdateFields = {};

    switch (action) {
      case 'approve':
        updateFields = { 
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: session.user.id,
          adminNotes: reason || 'Claim approved by admin'
        };
        
        // Mark the item as resolved when claim is approved
        itemUpdateFields = {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: session.user.id
        };
        break;
      
      case 'reject':
        updateFields = { 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: session.user.id,
          adminNotes: reason || 'Claim rejected by admin'
        };
        break;
      
      case 'pending':
        updateFields = { 
          status: 'pending',
          approvedAt: null,
          rejectedAt: null,
          approvedBy: null,
          rejectedBy: null,
          adminNotes: reason || 'Claim status reset to pending'
        };
        
        // Reset item status if it was resolved due to this claim
        itemUpdateFields = {
          status: 'active',
          resolvedAt: null,
          resolvedBy: null
        };
        break;
      
      case 'update':
        // Allow updating admin notes
        if (reason) {
          updateFields.adminNotes = reason;
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the claim
    const claim = await Claim.findByIdAndUpdate(
      params.id,
      { ...updateFields, updatedAt: new Date() },
      { new: true }
    ).populate('claimant', 'name email studentId')
     .populate('item', 'title type category');

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Update the related item if needed
    if (Object.keys(itemUpdateFields).length > 0 && claim.item) {
      await Item.findByIdAndUpdate(
        claim.item._id,
        { ...itemUpdateFields, updatedAt: new Date() }
      );
    }

    return NextResponse.json({ 
      message: 'Claim updated successfully',
      claim 
    });

  } catch (error) {
    console.error('Claim PATCH error:', error);
    
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

    const claim = await Claim.findByIdAndDelete(params.id);

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Claim deleted successfully' 
    });

  } catch (error) {
    console.error('Claim DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
