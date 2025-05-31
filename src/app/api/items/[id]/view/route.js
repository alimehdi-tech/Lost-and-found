import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Item from '@/models/Item';

export async function POST(request, { params }) {
  try {
    await connectDB();

    const item = await Item.findById(params.id);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Increment views
    item.views = (item.views || 0) + 1;
    await item.save();

    return NextResponse.json({
      message: 'View count incremented',
      views: item.views
    });

  } catch (error) {
    console.error('View increment error:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}
