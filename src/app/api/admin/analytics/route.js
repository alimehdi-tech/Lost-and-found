import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Item from '@/models/Item';
import Claim from '@/models/Claim';

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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date ranges
    const now = new Date();
    let startDate, previousStartDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Get overview statistics
    const [totalUsers, totalItems, totalClaims] = await Promise.all([
      User.countDocuments({}),
      Item.countDocuments({}),
      Claim.countDocuments({})
    ]);

    const [resolvedItems, activeItems] = await Promise.all([
      Item.countDocuments({ status: 'resolved' }),
      Item.countDocuments({ status: 'active' })
    ]);

    // Calculate total views
    const itemsWithViews = await Item.find({}, 'views');
    const totalViews = itemsWithViews.reduce((sum, item) => sum + (item.views || 0), 0);

    // Get trend data
    const [itemsThisMonth, itemsLastMonth] = await Promise.all([
      Item.countDocuments({ createdAt: { $gte: startDate } }),
      Item.countDocuments({ 
        createdAt: { 
          $gte: previousStartDate, 
          $lt: startDate 
        } 
      })
    ]);

    const [usersThisMonth, usersLastMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ 
        createdAt: { 
          $gte: previousStartDate, 
          $lt: startDate 
        } 
      })
    ]);

    const [claimsThisMonth, claimsLastMonth] = await Promise.all([
      Claim.countDocuments({ createdAt: { $gte: startDate } }),
      Claim.countDocuments({ 
        createdAt: { 
          $gte: previousStartDate, 
          $lt: startDate 
        } 
      })
    ]);

    // Get categories breakdown
    const categoriesData = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const categories = categoriesData.map(cat => ({
      name: cat._id || 'Uncategorized',
      count: cat.count
    }));

    // Get top locations
    const locationsData = await Item.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const topLocations = locationsData.map(loc => ({
      name: loc._id || 'Unknown',
      count: loc.count
    }));

    // Get recent activity
    const recentItems = await Item.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .lean();

    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const recentClaims = await Claim.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('claimant', 'name')
      .populate('item', 'title')
      .lean();

    const recentActivity = [
      ...recentItems.map(item => ({
        type: 'item',
        description: `New ${item.type} item "${item.title}" posted by ${item.user?.name || 'Unknown'}`,
        timestamp: item.createdAt.toLocaleDateString()
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        description: `New user "${user.name}" registered`,
        timestamp: user.createdAt.toLocaleDateString()
      })),
      ...recentClaims.map(claim => ({
        type: 'claim',
        description: `Claim submitted for "${claim.item?.title}" by ${claim.claimant?.name || 'Unknown'}`,
        timestamp: claim.createdAt.toLocaleDateString()
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    const analytics = {
      overview: {
        totalItems,
        totalUsers,
        totalClaims,
        resolvedItems,
        activeItems,
        totalViews
      },
      trends: {
        itemsThisMonth,
        itemsLastMonth,
        usersThisMonth,
        usersLastMonth,
        claimsThisMonth,
        claimsLastMonth
      },
      categories,
      topLocations,
      recentActivity
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
