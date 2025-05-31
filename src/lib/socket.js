import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their personal room for notifications
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join chat room
      socket.on('join_chat', (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`User joined chat: ${chatId}`);
      });

      // Leave chat room
      socket.on('leave_chat', (chatId) => {
        socket.leave(`chat_${chatId}`);
        console.log(`User left chat: ${chatId}`);
      });

      // Handle new message
      socket.on('send_message', (data) => {
        const { chatId, message, senderId, senderName } = data;
        
        // Broadcast message to all users in the chat room
        socket.to(`chat_${chatId}`).emit('new_message', {
          id: Date.now(),
          content: message,
          senderId,
          senderName,
          timestamp: new Date().toISOString(),
          chatId
        });
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { chatId, userId, userName } = data;
        socket.to(`chat_${chatId}`).emit('user_typing', { userId, userName });
      });

      socket.on('typing_stop', (data) => {
        const { chatId, userId } = data;
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', { userId });
      });

      // Handle user status
      socket.on('user_online', (userId) => {
        socket.broadcast.emit('user_status_change', { userId, status: 'online' });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // You could emit user offline status here
      });
    });
  }

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper functions for emitting events
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(`chat_${chatId}`).emit(event, data);
  }
};

export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};
