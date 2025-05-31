import Notification from '@/models/Notification';
import connectDB from './db';

// Notification types and their templates
const NOTIFICATION_TEMPLATES = {
  new_claim: {
    title: 'New Claim Request',
    getMessage: (data) => `${data.claimantName} has submitted a claim for your ${data.itemType} item "${data.itemTitle}"`
  },
  claim_approved: {
    title: 'Claim Approved',
    getMessage: (data) => `Your claim for "${data.itemTitle}" has been approved. You can now contact the owner.`
  },
  claim_rejected: {
    title: 'Claim Rejected',
    getMessage: (data) => `Your claim for "${data.itemTitle}" has been rejected. ${data.reason || ''}`
  },
  claim_completed: {
    title: 'Claim Completed',
    getMessage: (data) => `The claim for "${data.itemTitle}" has been marked as completed.`
  },
  item_matched: {
    title: 'Potential Match Found',
    getMessage: (data) => `We found a potential match for your ${data.itemType} item. Check it out!`
  },
  message_received: {
    title: 'New Message',
    getMessage: (data) => `You have a new message from ${data.senderName} about "${data.itemTitle}"`
  },
  item_expired: {
    title: 'Item Listing Expired',
    getMessage: (data) => `Your ${data.itemType} item "${data.itemTitle}" listing has expired after 30 days.`
  },
  system_announcement: {
    title: 'System Announcement',
    getMessage: (data) => data.message
  }
};

// Create notification
export const createNotification = async (type, recipientId, data, options = {}) => {
  try {
    await connectDB();

    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const notification = await Notification.createNotification({
      recipient: recipientId,
      sender: data.senderId || null,
      type,
      title: options.title || template.title,
      message: options.message || template.getMessage(data),
      relatedItem: data.itemId || null,
      relatedClaim: data.claimId || null,
      actionUrl: options.actionUrl || null,
      priority: options.priority || 'medium',
      expiresAt: options.expiresAt || null
    });

    // Here you would emit socket event for real-time notifications
    // if (global.io) {
    //   global.io.to(recipientId.toString()).emit('new_notification', notification);
    // }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create multiple notifications
export const createBulkNotifications = async (notifications) => {
  try {
    await connectDB();

    const notificationPromises = notifications.map(({ type, recipientId, data, options }) =>
      createNotification(type, recipientId, data, options)
    );

    const results = await Promise.all(notificationPromises);
    return results;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (userId, options = {}) => {
  try {
    await connectDB();

    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = options;

    const query = { recipient: userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('relatedItem', 'title type')
      .populate('relatedClaim', 'status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    await connectDB();

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await connectDB();
    
    const result = await Notification.markAllAsRead(userId);
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId) => {
  try {
    await connectDB();
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async () => {
  try {
    await connectDB();
    
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};
