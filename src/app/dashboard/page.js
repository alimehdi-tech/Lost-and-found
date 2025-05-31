'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    resolvedPosts: 0,
    totalViews: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's items
      const response = await fetch(`/api/items?postedBy=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        const userItems = data.items;
        const activePosts = userItems.filter(item => item.status === 'active').length;
        const resolvedPosts = userItems.filter(item => item.status === 'resolved').length;
        const totalViews = userItems.reduce((sum, item) => sum + (item.views || 0), 0);

        setStats({
          totalPosts: userItems.length,
          activePosts,
          resolvedPosts,
          totalViews
        });

        setRecentItems(userItems.slice(0, 5));
      }

      // Fetch user's claims
      const claimsResponse = await fetch('/api/claims?type=sent');
      const claimsData = await claimsResponse.json();

      if (claimsResponse.ok) {
        setMyClaims(claimsData.claims.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your lost and found activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlusIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activePosts}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolvedPosts}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Posts */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Posts</h3>
                  <Link href="/items/post" className="flex items-center w-auto bg-black text-white hover:bg-gray-900 px-4 py-2 rounded">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Post
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {recentItems.length > 0 ? (
                  <div className="space-y-4">
                    {recentItems.map((item) => (
                      <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {item.title}
                              </h4>
                              <span className={`badge ${
                                item.type === 'lost' ? 'badge-danger' : 'badge-success'
                              }`}>
                                {item.type === 'lost' ? 'Lost' : 'Found'}
                              </span>
                              <span className={`badge ${
                                item.status === 'active' ? 'badge-warning' : 'badge-info'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Posted {formatDate(item.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              {item.views} views
                            </div>
                            {item.claimsCount > 0 && (
                              <div className="flex items-center">
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                                {item.claimsCount} claims
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex space-x-2">
                          <Link
                            href={`/items/${item._id}`}
                            className="btn-secondary text-xs"
                          >
                            View Details
                          </Link>
                          <Link
                            href={`/items/${item._id}/edit`}
                            className="btn-secondary text-xs"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by posting your first lost or found item.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <Link href="/items/post" className="flex items-center w-auto bg-black text-white hover:bg-gray-900 px-4 py-2 rounded">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Post Your First Item
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Claims */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">My Claim Requests</h3>
            </div>
            <div className="card-body">
              {myClaims.length > 0 ? (
                <div className="space-y-3">
                  {myClaims.map((claim) => (
                    <div key={claim._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {claim.item?.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {formatDate(claim.createdAt)}
                          </p>
                        </div>
                        <span className={`badge text-xs ${
                          claim.status === 'pending' ? 'badge-warning' :
                          claim.status === 'approved' ? 'badge-success' :
                          claim.status === 'rejected' ? 'badge-danger' : 'badge-info'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No claim requests yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <Link
                    href="/items/post"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-blue-900">Post New Item</span>
                  </Link>

                  <Link
                    href="/items/lost"
                    className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-sm font-medium text-red-900">Browse Lost Items</span>
                  </Link>

                  <Link
                    href="/items/found"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-green-900">Browse Found Items</span>
                  </Link>

                  <Link
                    href="/chat"
                    className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-purple-900">My Conversations</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Tips for Success</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3"></div>
                    <p>Include clear photos and detailed descriptions</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3"></div>
                    <p>Specify exact location where item was lost/found</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3"></div>
                    <p>Respond quickly to messages and claims</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3"></div>
                    <p>Mark items as resolved when found/returned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
