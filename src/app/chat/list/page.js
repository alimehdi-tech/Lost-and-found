'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function ChatList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session) {
      fetchChats();
    }
  }, [session]);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (response.ok) {
        setChats(data.chats || []);
      } else {
        console.error('Failed to fetch chats:', data.error);
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== session?.user?.id);
  };

  const getUnreadCount = (chat) => {
    const count = chat.unreadCount?.get?.(session?.user?.id) || 0;
    return count;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Yesterday`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    const itemTitle = chat.relatedItem?.title || '';
    const participantName = otherParticipant?.name || '';

    return (
      itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">
            Your conversations about lost and found items
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredChats.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const unreadCount = getUnreadCount(chat);

                return (
                  <Link
                    key={chat._id}
                    href={`/chat?chatId=${chat._id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {otherParticipant?.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt={otherParticipant.name}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon className="h-12 w-12 text-gray-400" />
                          )}
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {otherParticipant?.name || 'Unknown User'}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                chat.relatedItem?.type === 'lost'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {chat.relatedItem?.type || 'item'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                              <p className="text-xs text-gray-500">
                                {formatTime(chat.updatedAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 truncate mt-1">
                            <span className="font-medium">Re: {chat.relatedItem?.title}</span>
                          </p>

                          {chat.lastMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {chat.lastMessage.sender === session?.user?.id ? 'You: ' : ''}
                              {chat.lastMessage.content}
                            </p>
                          )}
                        </div>

                        {/* Chat Icon */}
                        <div className="flex-shrink-0">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No conversations match your search.' : 'Start a conversation by contacting someone about their lost or found item.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    href="/items/lost"
                    className="btn-primary"
                  >
                    Browse Items
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
