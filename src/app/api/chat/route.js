import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import { authOptions } from '@/lib/auth';
import { notifyNewMessage } from '@/lib/notifications';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const itemId = searchParams.get('itemId');
    const otherUserId = searchParams.get('otherUserId');

    if (chatId) {
      // Get specific chat
      const chat = await Chat.findById(chatId)
        .populate('participants', 'name avatar email')
        .populate('relatedItem', 'title type')
        .lean();

      if (!chat) {
        return NextResponse.json(
          { error: 'Chat not found' },
          { status: 404 }
        );
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(
        p => p._id.toString() === session.user.id
      );

      if (!isParticipant) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({ chat });
    }

    if (itemId && otherUserId) {
      // Find or create chat for item discussion
      let chat = await Chat.findOrCreateChat(
        [session.user.id, otherUserId],
        itemId
      );

      await chat.populate([
        { path: 'participants', select: 'name avatar email' },
        { path: 'relatedItem', select: 'title type' },
        { path: 'messages.sender', select: 'name avatar' }
      ]);

      return NextResponse.json({ chat });
    }

    // Get all user's chats
    const chats = await Chat.find({
      participants: session.user.id,
      status: 'active'
    })
    .populate('participants', 'name avatar email')
    .populate('relatedItem', 'title type')
    .sort({ updatedAt: -1 })
    .lean();

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
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

    const { chatId, message, messageType = 'text' } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      );
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Add message using the model method
    await chat.addMessage(session.user.id, message, messageType);

    // Populate the new message for response
    await chat.populate('messages.sender', 'name avatar');
    const populatedMessage = chat.messages[chat.messages.length - 1];

    // Create consistent message object for response
    const messageToReturn = {
      _id: populatedMessage._id,
      content: populatedMessage.content,
      messageType: populatedMessage.messageType,
      timestamp: populatedMessage.timestamp,
      createdAt: populatedMessage.createdAt,
      sender: {
        _id: session.user.id,
        name: session.user.name,
        avatar: session.user.avatar
      }
    };

    // Create notification for other participants
    try {
      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== session.user.id
      );

      for (const participant of otherParticipants) {
        await notifyNewMessage(
          participant._id,
          session.user.name,
          chat.relatedItem?.title || 'an item',
          chat._id,
          chat.relatedItem?._id
        );
      }
    } catch (notificationError) {
      console.error('Error creating message notification:', notificationError);
      // Don't fail the message send if notification fails
    }

    // Emit real-time message (in production, you'd use actual Socket.IO)
    if (global.io) {
      global.io.to(`chat_${chatId}`).emit('new_message', {
        ...messageToReturn,
        chatId
      });
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      newMessage: messageToReturn
    });

  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
