'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function Notifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [creatingTest, setCreatingTest] = useState(false);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notif => notif._id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'claim_request':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'claim_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'claim_rejected':
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      case 'message':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
      case 'item_match':
        return <InformationCircleIcon className="h-5 w-5 text-purple-500" />;
      case 'item_found':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'item_claimed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'new_message':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationActions = (notification) => {
    const actions = [];

    switch (notification.type) {
      case 'claim_request':
        if (notification.data?.claimId) {
          actions.push({
            label: 'Review Claim',
            href: `/claims/${notification.data.claimId}`,
            className: 'text-blue-600 hover:text-blue-800'
          });
        }
        break;
      case 'message':
      case 'new_message':
        if (notification.data?.chatId) {
          actions.push({
            label: 'View Chat',
            href: `/chat?chatId=${notification.data.chatId}`,
            className: 'text-blue-600 hover:text-blue-800'
          });
        }
        break;
      case 'item_match':
        if (notification.data?.itemId) {
          actions.push({
            label: 'View Item',
            href: `/items/${notification.data.itemId}`,
            className: 'text-blue-600 hover:text-blue-800'
          });
        }
        break;
      case 'claim_approved':
      case 'claim_rejected':
        if (notification.data?.itemId) {
          actions.push({
            label: 'View Item',
            href: `/items/${notification.data.itemId}`,
            className: 'text-blue-600 hover:text-blue-800'
          });
        }
        break;
    }

    return actions;
  };

  const createTestNotifications = async () => {
    setCreatingTest(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchNotifications(); // Refresh notifications
      } else {
        console.error('Failed to create test notifications');
      }
    } catch (error) {
      console.error('Error creating test notifications:', error);
    } finally {
      setCreatingTest(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
      } else {
        console.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">Please log in to view your notifications.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with your lost and found activity
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn-secondary"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Mark all as read
                </button>
              )}

              {/* Test buttons - remove in production */}
              <button
                onClick={createTestNotifications}
                disabled={creatingTest}
                className="btn-primary text-sm"
              >
                {creatingTest ? 'Creating...' : 'Add Test Notifications'}
              </button>

              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="btn-danger text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read', label: 'Read', count: notifications.length - unreadCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`card hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm ${
                            !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDate(notification.createdAt)}
                          </div>

                          <div className="flex items-center space-x-2">
                            {getNotificationActions(notification).map((action, index) => (
                              <Link
                                key={index}
                                href={action.href}
                                className={`text-xs font-medium ${action.className}`}
                                onClick={() => markAsRead(notification._id)}
                              >
                                {action.label}
                              </Link>
                            ))}

                            {notification.actionUrl && (
                              <Link
                                href={notification.actionUrl}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => markAsRead(notification._id)}
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete notification"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' : 'No notifications'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all'
                ? "You'll receive notifications when someone interacts with your posts or sends you messages."
                : `Switch to "${filter === 'unread' ? 'all' : 'unread'}" to see ${filter === 'unread' ? 'all' : 'unread'} notifications.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
