'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import { useNotifications } from './NotificationProvider';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (session?.user?.id) {
      // Initialize socket connection
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        auth: {
          userId: session.user.id
        }
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      // Listen for new notifications
      socketInstance.on('new_notification', (notification) => {
        addNotification(notification);

        // Show browser notification if permission granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification._id
          });
        }
      });

      // Listen for new messages
      socketInstance.on('new_message', (message) => {
        // Handle new chat messages
        console.log('New message received:', message);
      });

      // Listen for item updates
      socketInstance.on('item_updated', (item) => {
        // Handle item updates
        console.log('Item updated:', item);
      });

      // Listen for claim updates
      socketInstance.on('claim_updated', (claim) => {
        // Handle claim updates
        console.log('Claim updated:', claim);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [session?.user?.id, addNotification]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const value = {
    socket,
    isConnected,
    emit: (event, data) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    joinRoom: (roomId) => {
      if (socket) {
        socket.emit('join_room', roomId);
      }
    },
    leaveRoom: (roomId) => {
      if (socket) {
        socket.emit('leave_room', roomId);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
