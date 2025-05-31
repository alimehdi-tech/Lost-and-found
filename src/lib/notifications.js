import connectDB from './db';
import Notification from '@/models/Notification';

export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
  actionUrl = null
}) {
  try {
    await connectDB();

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      isRead: false,
      createdAt: new Date()
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Notification templates
export const NotificationTypes = {
  CLAIM_REQUEST: 'claim_request',
  CLAIM_APPROVED: 'claim_approved',
  CLAIM_REJECTED: 'claim_rejected',
  MESSAGE: 'message',
  NEW_MESSAGE: 'new_message',
  ITEM_MATCH: 'item_match',
  ITEM_FOUND: 'item_found',
  ITEM_CLAIMED: 'item_claimed'
};

export async function notifyClaimRequest(itemOwnerId, claimerName, itemTitle, claimId, itemId) {
  return await createNotification({
    userId: itemOwnerId,
    type: NotificationTypes.CLAIM_REQUEST,
    title: 'New Claim Request',
    message: `${claimerName} has requested to claim your item "${itemTitle}". Please review the claim.`,
    data: {
      claimId,
      itemId,
      claimerName
    },
    actionUrl: `/claims/${claimId}`
  });
}

export async function notifyClaimApproved(claimerId, itemTitle, itemId) {
  return await createNotification({
    userId: claimerId,
    type: NotificationTypes.CLAIM_APPROVED,
    title: 'Claim Approved',
    message: `Your claim for "${itemTitle}" has been approved! You can now contact the owner to arrange pickup.`,
    data: {
      itemId,
      itemTitle
    },
    actionUrl: `/items/${itemId}`
  });
}

export async function notifyClaimRejected(claimerId, itemTitle, itemId, reason = null) {
  const reasonText = reason ? ` Reason: ${reason}` : '';
  return await createNotification({
    userId: claimerId,
    type: NotificationTypes.CLAIM_REJECTED,
    title: 'Claim Rejected',
    message: `Your claim for "${itemTitle}" has been rejected.${reasonText}`,
    data: {
      itemId,
      itemTitle,
      reason
    },
    actionUrl: `/items/${itemId}`
  });
}

export async function notifyNewMessage(recipientId, senderName, itemTitle, chatId, itemId) {
  return await createNotification({
    userId: recipientId,
    type: NotificationTypes.NEW_MESSAGE,
    title: 'New Message',
    message: `${senderName} sent you a message about "${itemTitle}".`,
    data: {
      chatId,
      itemId,
      senderName,
      itemTitle
    },
    actionUrl: `/chat?chatId=${chatId}`
  });
}

export async function notifyItemMatch(userId, matchedItemTitle, matchedItemId, yourItemTitle) {
  return await createNotification({
    userId: userId,
    type: NotificationTypes.ITEM_MATCH,
    title: 'Possible Item Match',
    message: `We found a possible match for your "${yourItemTitle}". Check out "${matchedItemTitle}".`,
    data: {
      matchedItemId,
      matchedItemTitle,
      yourItemTitle
    },
    actionUrl: `/items/${matchedItemId}`
  });
}

export async function notifyItemFound(itemOwnerId, finderName, itemTitle, itemId) {
  return await createNotification({
    userId: itemOwnerId,
    type: NotificationTypes.ITEM_FOUND,
    title: 'Your Item May Have Been Found',
    message: `${finderName} posted a found item that might be yours: "${itemTitle}". Check it out!`,
    data: {
      itemId,
      itemTitle,
      finderName
    },
    actionUrl: `/items/${itemId}`
  });
}

export async function notifyItemClaimed(itemOwnerId, claimerName, itemTitle, itemId) {
  return await createNotification({
    userId: itemOwnerId,
    type: NotificationTypes.ITEM_CLAIMED,
    title: 'Item Successfully Claimed',
    message: `Your item "${itemTitle}" has been successfully claimed by ${claimerName}.`,
    data: {
      itemId,
      itemTitle,
      claimerName
    },
    actionUrl: `/items/${itemId}`
  });
}

// Bulk notification functions
export async function notifyMultipleUsers(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    userId
  }));

  try {
    await connectDB();
    await Notification.insertMany(notifications);
    return true;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return false;
  }
}

// Clean up old notifications (call this periodically)
export async function cleanupOldNotifications(daysOld = 30) {
  try {
    await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return 0;
  }
}
