'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import { useUserStatus, getStatusColor, getStatusText } from '@/hooks/useUserStatus';

export default function Chat() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const { getUserStatus, getStatusIndicator, formatLastSeen } = useUserStatus();

  const chatId = searchParams.get('chatId');
  const itemId = searchParams.get('itemId');
  const otherUserId = searchParams.get('otherUserId');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState(null);

  // Fetch other user's status
  const fetchOtherUserStatus = async (userId) => {
    try {
      const status = await getUserStatus(userId);
      setOtherUserStatus(status);
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  };

  // Fetch chat data
  useEffect(() => {
    if (session && (chatId || (itemId && otherUserId))) {
      fetchChat();
    }
  }, [session, chatId, itemId, otherUserId]);

  // Fetch other user's status when chat info is available
  useEffect(() => {
    if (chatInfo?.participants) {
      const otherUser = chatInfo.participants.find(p => p._id !== session?.user?.id);
      if (otherUser) {
        fetchOtherUserStatus(otherUser._id);

        // Refresh status every 30 seconds
        const statusInterval = setInterval(() => {
          fetchOtherUserStatus(otherUser._id);
        }, 30000);

        return () => clearInterval(statusInterval);
      }
    }
  }, [chatInfo, session]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    try {
      setLoading(true);
      let url = '/api/chat';

      if (chatId) {
        url += `?chatId=${chatId}`;
      } else if (itemId && otherUserId) {
        url += `?itemId=${itemId}&otherUserId=${otherUserId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setChatInfo(data.chat);
        setMessages(data.chat.messages || []);
      } else {
        console.error('Failed to fetch chat:', data.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Add message optimistically to UI with consistent sender ID
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        sender: {
          _id: session?.user?.id,
          name: session?.user?.name,
          avatar: session?.user?.avatar
        },
        content: messageContent,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        sending: true,
        isOptimistic: true
      };

      setMessages(prev => [...prev, tempMessage]);

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatInfo?._id,
          message: messageContent,
          itemId: searchParams.get('itemId'),
          otherUserId: searchParams.get('otherUserId')
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Replace temp message with real message, ensuring sender ID consistency
        setMessages(prev =>
          prev.map(msg =>
            msg._id === tempMessage._id
              ? {
                  ...data.newMessage,
                  _id: data.newMessage._id,
                  sender: {
                    ...data.newMessage.sender,
                    _id: session?.user?.id // Ensure sender ID stays consistent
                  }
                }
              : msg
          )
        );
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        console.error('Failed to send message:', data.error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
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
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Other user's info */}
                {chatInfo?.participants && (
                  (() => {
                    const otherUser = chatInfo.participants.find(p => p._id !== session?.user?.id);
                    return otherUser ? (
                      <div className="flex items-center">
                        {otherUser.avatar ? (
                          <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <h1 className="text-lg font-semibold text-gray-900">
                            {otherUser.name || 'Unknown User'}
                          </h1>
                          <div className="flex items-center">
                            {(() => {
                              const status = otherUserStatus ? getStatusIndicator(otherUserStatus) : 'offline';
                              const statusColor = getStatusColor(status);
                              const statusText = getStatusText(status);

                              return (
                                <>
                                  <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                  <span className="text-sm text-gray-500 ml-2">
                                    {status === 'online' ? statusText :
                                     otherUserStatus ? formatLastSeen(otherUserStatus.lastSeen) : 'Offline'}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                          Chat about {chatInfo?.relatedItem?.title || 'Lost Item'}
                        </h1>
                        <p className="text-sm text-gray-500">
                          Discussing item recovery
                        </p>
                      </div>
                    );
                  })()
                )}
              </div>
              <div className="text-right">
                {chatInfo?.relatedItem && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {chatInfo.relatedItem.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {chatInfo.relatedItem.type === 'lost' ? 'Lost Item' : 'Found Item'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              messages.map((message, index) => {
                // Use consistent logic for determining message ownership
                const isOwn = message.sender?._id === session?.user?.id ||
                             message.isOptimistic ||
                             message.sending;

                const showAvatar = !isOwn; // Only show avatar for other users
                const senderName = isOwn ? session?.user?.name : message.sender?.name;
                const senderAvatar = isOwn ? session?.user?.avatar : message.sender?.avatar;

                return (
                  <div
                    key={message._id || `msg-${index}`}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`flex items-end max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar - only for other users */}
                      {showAvatar && (
                        <div className="flex-shrink-0 mr-2">
                          {senderAvatar ? (
                            <img
                              src={senderAvatar}
                              alt={senderName || 'User'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {senderName?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className="flex flex-col">
                        {/* Sender name for other users */}
                        {!isOwn && (
                          <span className="text-xs text-gray-500 mb-1 ml-3">
                            {senderName || 'Unknown User'}
                          </span>
                        )}

                        <div
                          className={`px-4 py-2 rounded-lg relative ${
                            isOwn
                              ? 'bg-gray-500 text-white rounded-br-sm'
                              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                          } ${message.sending ? 'opacity-70' : ''}`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          {message.sending && (
                            <div className="absolute -right-1 -bottom-1">
                              <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent"></div>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right mr-3' : 'text-left ml-3'}`}>
                          {formatTime(message.timestamp || message.createdAt)}
                          {message.sending && (
                            <span className="ml-1 text-blue-400">Sending...</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="flex max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0 mr-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">...</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="form-input"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Chat Guidelines */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Chat Guidelines</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Be respectful and courteous in your communication</li>
            <li>• Arrange to meet in safe, public places on campus</li>
            <li>• Verify item ownership before returning</li>
            <li>• Report any suspicious behavior to campus security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
