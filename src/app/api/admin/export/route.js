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
    const type = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let csvData = '';
    let filename = '';

    switch (type) {
      case 'items':
        const items = await Item.find({
          createdAt: { $gte: startDate }
        }).populate('user', 'name email').lean();

        csvData = 'ID,Title,Type,Category,Location,Status,User Name,User Email,Views,Created At,Updated At\n';
        
        items.forEach(item => {
          const row = [
            item._id,
            `"${item.title.replace(/"/g, '""')}"`,
            item.type,
            item.category || '',
            `"${item.location.replace(/"/g, '""')}"`,
            item.status,
            item.user?.name || '',
            item.user?.email || '',
            item.views || 0,
            item.createdAt.toISOString(),
            item.updatedAt.toISOString()
          ].join(',');
          csvData += row + '\n';
        });
        
        filename = `items_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'users':
        const users = await User.find({
          createdAt: { $gte: startDate }
        }).select('-password -verificationToken -resetPasswordToken').lean();

        csvData = 'ID,Name,Email,Role,Student ID,Phone,Verified,Created At,Last Login\n';
        
        users.forEach(user => {
          const row = [
            user._id,
            `"${user.name.replace(/"/g, '""')}"`,
            user.email,
            user.role,
            user.studentId || '',
            user.phone || '',
            user.isVerified ? 'Yes' : 'No',
            user.createdAt.toISOString(),
            user.lastLogin ? user.lastLogin.toISOString() : ''
          ].join(',');
          csvData += row + '\n';
        });
        
        filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'claims':
        const claims = await Claim.find({
          createdAt: { $gte: startDate }
        })
        .populate('claimant', 'name email')
        .populate('item', 'title type category')
        .lean();

        csvData = 'ID,Item Title,Item Type,Item Category,Claimant Name,Claimant Email,Status,Description,Created At,Updated At\n';
        
        claims.forEach(claim => {
          const row = [
            claim._id,
            `"${(claim.item?.title || '').replace(/"/g, '""')}"`,
            claim.item?.type || '',
            claim.item?.category || '',
            claim.claimant?.name || '',
            claim.claimant?.email || '',
            claim.status,
            `"${(claim.description || '').replace(/"/g, '""')}"`,
            claim.createdAt.toISOString(),
            claim.updatedAt.toISOString()
          ].join(',');
          csvData += row + '\n';
        });
        
        filename = `claims_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'analytics':
        // Export comprehensive analytics data
        const [totalUsers, totalItems, totalClaims] = await Promise.all([
          User.countDocuments({}),
          Item.countDocuments({}),
          Claim.countDocuments({})
        ]);

        const [resolvedItems, activeItems] = await Promise.all([
          Item.countDocuments({ status: 'resolved' }),
          Item.countDocuments({ status: 'active' })
        ]);

        // Categories breakdown
        const categoriesData = await Item.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          }
        ]);

        // Locations breakdown
        const locationsData = await Item.aggregate([
          {
            $group: {
              _id: '$location',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          }
        ]);

        csvData = 'Metric,Value\n';
        csvData += `Total Users,${totalUsers}\n`;
        csvData += `Total Items,${totalItems}\n`;
        csvData += `Total Claims,${totalClaims}\n`;
        csvData += `Resolved Items,${resolvedItems}\n`;
        csvData += `Active Items,${activeItems}\n`;
        csvData += `Resolution Rate,${totalItems > 0 ? ((resolvedItems / totalItems) * 100).toFixed(2) : 0}%\n`;
        csvData += '\nCategories,Count\n';
        
        categoriesData.forEach(cat => {
          csvData += `"${(cat._id || 'Uncategorized').replace(/"/g, '""')}",${cat.count}\n`;
        });
        
        csvData += '\nLocations,Count\n';
        locationsData.forEach(loc => {
          csvData += `"${(loc._id || 'Unknown').replace(/"/g, '""')}",${loc.count}\n`;
        });
        
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Return CSV file
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
