import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createNotification,
  NotificationTypes,
  notifyClaimRequest,
  notifyNewMessage,
  notifyItemMatch
} from '@/lib/notifications';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create sample notifications for testing
    const sampleNotifications = [
      {
        userId: session.user.id,
        type: NotificationTypes.CLAIM_REQUEST,
        title: 'New Claim Request',
        message: 'John Doe has requested to claim your found iPhone 13 Pro. Please review the claim details.',
        data: {
          claimId: 'sample_claim_1',
          itemId: 'sample_item_1',
          claimerName: 'John Doe'
        },
        actionUrl: '/claims/sample_claim_1'
      },
      {
        userId: session.user.id,
        type: NotificationTypes.NEW_MESSAGE,
        title: 'New Message',
        message: 'Sarah Wilson sent you a message about your lost backpack.',
        data: {
          chatId: 'sample_chat_1',
          itemId: 'sample_item_2',
          senderName: 'Sarah Wilson',
          itemTitle: 'Blue Backpack'
        },
        actionUrl: '/chat?chatId=sample_chat_1'
      },
      {
        userId: session.user.id,
        type: NotificationTypes.ITEM_MATCH,
        title: 'Possible Item Match',
        message: 'We found a possible match for your lost keys. Check out "Found Keys with UMT Keychain".',
        data: {
          matchedItemId: 'sample_item_3',
          matchedItemTitle: 'Found Keys with UMT Keychain',
          yourItemTitle: 'Lost Keys'
        },
        actionUrl: '/items/sample_item_3'
      },
      {
        userId: session.user.id,
        type: NotificationTypes.CLAIM_APPROVED,
        title: 'Claim Approved',
        message: 'Your claim for "Lost Wallet" has been approved! You can now contact the owner.',
        data: {
          itemId: 'sample_item_4',
          itemTitle: 'Lost Wallet'
        },
        actionUrl: '/items/sample_item_4'
      },
      {
        userId: session.user.id,
        type: NotificationTypes.ITEM_FOUND,
        title: 'Your Item May Have Been Found',
        message: 'Mike Johnson posted a found item that might be yours: "Found Laptop Charger".',
        data: {
          itemId: 'sample_item_5',
          itemTitle: 'Found Laptop Charger',
          finderName: 'Mike Johnson'
        },
        actionUrl: '/items/sample_item_5'
      }
    ];

    // Create all sample notifications
    const createdNotifications = [];
    for (const notificationData of sampleNotifications) {
      const notification = await createNotification(notificationData);
      if (notification) {
        createdNotifications.push(notification);
      }
    }

    return NextResponse.json({
      message: `Created ${createdNotifications.length} sample notifications`,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create test notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete all notifications for the current user (for testing)
    const { default: Notification } = await import('@/models/Notification');
    const { default: connectDB } = await import('@/lib/db');
    
    await connectDB();
    
    const result = await Notification.deleteMany({
      userId: session.user.id
    });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} notifications`
    });

  } catch (error) {
    console.error('Error deleting test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete test notifications' },
      { status: 500 }
    );
  }
}
