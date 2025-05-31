'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useUserStatus() {
  const { data: session } = useSession();
  const [userStatuses, setUserStatuses] = useState(new Map());
  const [isOnline, setIsOnline] = useState(true);

  // Update current user's status
  const updateStatus = useCallback(async (status = 'online') => {
    if (!session) return;

    try {
      await fetch('/api/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [session]);

  // Get specific user's status
  const getUserStatus = useCallback(async (userId) => {
    if (!session || !userId) return null;

    try {
      const response = await fetch(`/api/users/status?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error('Failed to get user status:', error);
    }
    return null;
  }, [session]);

  // Set user offline
  const setOffline = useCallback(async () => {
    if (!session) return;

    try {
      await fetch('/api/users/status', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to set offline:', error);
    }
  }, [session]);

  // Check if user is online (last seen within 5 minutes)
  const isUserOnline = useCallback((lastSeen, status) => {
    if (!lastSeen || status !== 'online') return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  }, []);

  // Get online status indicator
  const getStatusIndicator = useCallback((user) => {
    if (!user) return 'offline';
    
    if (isUserOnline(user.lastSeen, user.status)) {
      return 'online';
    } else if (user.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return 'recently'; // Recently active
      } else if (diffMinutes < 1440) { // Less than 24 hours
        return 'today';
      } else {
        return 'offline';
      }
    }
    
    return 'offline';
  }, [isUserOnline]);

  // Format last seen time
  const formatLastSeen = useCallback((lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus('online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    const handleBeforeUnload = () => {
      setOffline();
    };

    // Set initial status
    if (session) {
      updateStatus('online');
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic status update (every 2 minutes)
    const statusInterval = setInterval(() => {
      if (session && isOnline && !document.hidden) {
        updateStatus('online');
      }
    }, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(statusInterval);
      
      // Set offline when component unmounts
      if (session) {
        setOffline();
      }
    };
  }, [session, isOnline, updateStatus, setOffline]);

  return {
    updateStatus,
    getUserStatus,
    setOffline,
    isUserOnline,
    getStatusIndicator,
    formatLastSeen,
    isOnline,
    userStatuses
  };
}

// Hook for getting multiple users' statuses
export function useUsersStatus(userIds = []) {
  const [statuses, setStatuses] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const { getUserStatus } = useUserStatus();

  const fetchStatuses = useCallback(async () => {
    if (userIds.length === 0) return;

    setLoading(true);
    const newStatuses = new Map();

    try {
      const promises = userIds.map(async (userId) => {
        const status = await getUserStatus(userId);
        if (status) {
          newStatuses.set(userId, status);
        }
      });

      await Promise.all(promises);
      setStatuses(newStatuses);
    } catch (error) {
      console.error('Failed to fetch user statuses:', error);
    } finally {
      setLoading(false);
    }
  }, [userIds, getUserStatus]);

  useEffect(() => {
    fetchStatuses();
    
    // Refresh statuses every 30 seconds
    const interval = setInterval(fetchStatuses, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  return {
    statuses,
    loading,
    refreshStatuses: fetchStatuses
  };
}

// Status indicator component helper
export function getStatusColor(status) {
  switch (status) {
    case 'online':
      return 'bg-green-400';
    case 'recently':
      return 'bg-yellow-400';
    case 'today':
      return 'bg-gray-400';
    case 'offline':
    default:
      return 'bg-gray-300';
  }
}

export function getStatusText(status) {
  switch (status) {
    case 'online':
      return 'Online';
    case 'recently':
      return 'Recently active';
    case 'today':
      return 'Active today';
    case 'offline':
    default:
      return 'Offline';
  }
}
