import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'lost' or 'found'
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const postedBy = searchParams.get('postedBy');
    const dateRange = searchParams.get('dateRange');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const sortBy = searchParams.get('sortBy') || 'newest';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query = {};

    // Only filter by active status if not filtering by user
    if (!postedBy) {
      query.status = 'active';
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' };
    }

    if (postedBy) {
      query.postedBy = postedBy;
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};

    switch (sortBy) {
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      case 'title':
        sort.title = 1;
        break;
      case 'views':
        sort.views = -1;
        break;
      default:
        sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const items = await Item.find(query)
      .populate('postedBy', 'name avatar')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Item.countDocuments(query);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Items fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
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

    const {
      title,
      description,
      category,
      type,
      images,
      location,
      dateOccurred,
      contactInfo,
      tags,
      isUrgent,
      reward
    } = await request.json();

    // Validate required fields
    if (!title || !description || !category || !type || !location || !dateOccurred) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['lost', 'found'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "lost" or "found"' },
        { status: 400 }
      );
    }

    // Process images (convert base64 to storable format)
    const processedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        // In production, you'd upload to Cloudinary here
        // For now, we'll store the base64 data directly
        processedImages.push({
          url: image.data, // base64 data URL
          name: image.name,
          type: image.type,
          size: image.size,
          publicId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }

    // Create new item
    const item = new Item({
      title,
      description,
      category,
      type,
      images: processedImages,
      location,
      dateOccurred: new Date(dateOccurred),
      contactInfo: {
        email: contactInfo?.email || session.user.email,
        phone: contactInfo?.phone || '',
        preferredContact: contactInfo?.preferredContact || 'email'
      },
      postedBy: session.user.id,
      tags: tags || [],
      isUrgent: isUrgent || false,
      reward: reward || { offered: false }
    });

    await item.save();

    // Populate the postedBy field for response
    await item.populate('postedBy', 'name avatar');

    return NextResponse.json(
      {
        message: 'Item posted successfully',
        item
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Item creation error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
