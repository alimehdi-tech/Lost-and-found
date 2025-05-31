import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Claim from '@/models/Claim';
import Item from '@/models/Item';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/notifier';

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
    const type = searchParams.get('type'); // 'sent' or 'received'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    let query = {};
    
    if (type === 'sent') {
      query.claimant = session.user.id;
    } else if (type === 'received') {
      query.itemOwner = session.user.id;
    } else {
      // Get both sent and received claims
      query.$or = [
        { claimant: session.user.id },
        { itemOwner: session.user.id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('item', 'title type category location images')
      .populate('claimant', 'name email avatar')
      .populate('itemOwner', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Claim.countDocuments(query);

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Claims fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

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

    const { itemId, message, verificationAnswers, proofImages } = await request.json();

    // Validate required fields
    if (!itemId || !message) {
      return NextResponse.json(
        { error: 'Item ID and message are required' },
        { status: 400 }
      );
    }

    // Get the item
    const item = await Item.findById(itemId).populate('postedBy');
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to claim their own item
    if (item.postedBy._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot claim your own item' },
        { status: 400 }
      );
    }

    // Check if user has already claimed this item
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimant: session.user.id
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You have already submitted a claim for this item' },
        { status: 400 }
      );
    }

    // Create new claim
    const claim = new Claim({
      item: itemId,
      claimant: session.user.id,
      itemOwner: item.postedBy._id,
      message,
      verificationQuestions: verificationAnswers || [],
      proofImages: proofImages || []
    });

    await claim.save();

    // Increment claims count on item
    await Item.findByIdAndUpdate(itemId, {
      $inc: { claimsCount: 1 }
    });

    // Create notification for item owner
    await createNotification(
      'new_claim',
      item.postedBy._id,
      {
        claimantName: session.user.name,
        itemTitle: item.title,
        itemType: item.type,
        itemId: itemId,
        claimId: claim._id
      },
      {
        actionUrl: `/dashboard/claims/${claim._id}`
      }
    );

    // Populate the claim for response
    await claim.populate([
      { path: 'item', select: 'title type category location' },
      { path: 'claimant', select: 'name email avatar' },
      { path: 'itemOwner', select: 'name email avatar' }
    ]);

    return NextResponse.json(
      { 
        message: 'Claim submitted successfully',
        claim
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Claim creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    );
  }
}
