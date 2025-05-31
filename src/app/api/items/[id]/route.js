import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const item = await Item.findById(params.id)
      .populate('postedBy', 'name avatar email')
      .lean();

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });

  } catch (error) {
    console.error('Item fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;
    const updateData = await request.json();

    // Find the item and check ownership
    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (item.postedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own items' },
        { status: 403 }
      );
    }

    // Handle image updates
    let updatedImages = [...(item.images || [])];

    // Remove deleted images
    if (updateData.imagesToDelete && updateData.imagesToDelete.length > 0) {
      updatedImages = updatedImages.filter(img =>
        !updateData.imagesToDelete.some(delImg => delImg.url === img.url)
      );
    }

    // Add new images
    if (updateData.newImages && updateData.newImages.length > 0) {
      const newImageObjects = updateData.newImages.map(img => ({
        url: img.url,
        filename: img.filename || 'uploaded-image.jpg'
      }));
      updatedImages = [...updatedImages, ...newImageObjects];
    }

    // Prepare update object
    const {
      newImages,
      imagesToDelete,
      ...itemUpdateData
    } = updateData;

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        ...itemUpdateData,
        images: updatedImages,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email avatar');

    return NextResponse.json({
      message: 'Item updated successfully',
      item: updatedItem
    });

  } catch (error) {
    console.error('Item update error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find the item and check ownership
    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (item.postedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own items' },
        { status: 403 }
      );
    }

    await Item.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Item deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
