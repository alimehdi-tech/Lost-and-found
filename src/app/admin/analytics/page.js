'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalItems: 0,
      totalUsers: 0,
      totalClaims: 0,
      resolvedItems: 0,
      activeItems: 0,
      totalViews: 0
    },
    trends: {
      itemsThisMonth: 0,
      itemsLastMonth: 0,
      usersThisMonth: 0,
      usersLastMonth: 0,
      claimsThisMonth: 0,
      claimsLastMonth: 0
    },
    categories: [],
    recentActivity: [],
    topLocations: []
  });
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchAnalytics();
  }, [session, status, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatTrend = (trend) => {
    const isPositive = trend >= 0;
    return {
      value: Math.abs(trend).toFixed(1),
      isPositive,
      icon: isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  const exportData = async (type) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}&timeRange=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  const itemsTrend = formatTrend(calculateTrend(analytics.trends.itemsThisMonth, analytics.trends.itemsLastMonth));
  const usersTrend = formatTrend(calculateTrend(analytics.trends.usersThisMonth, analytics.trends.usersLastMonth));
  const claimsTrend = formatTrend(calculateTrend(analytics.trends.claimsThisMonth, analytics.trends.claimsLastMonth));

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights into your lost and found portal
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              className="form-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <div className="flex space-x-2">
              <button
                onClick={() => exportData('items')}
                className="btn btn-secondary btn-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export Items
              </button>
              <button
                onClick={() => exportData('users')}
                className="btn btn-secondary btn-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export Users
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalItems}</p>
              <div className="flex items-center mt-2">
                <itemsTrend.icon className={`h-4 w-4 mr-1 ${itemsTrend.color}`} />
                <span className={`text-sm ${itemsTrend.color}`}>
                  {itemsTrend.value}% from last month
                </span>
              </div>
            </div>
            <ShoppingBagIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
              <div className="flex items-center mt-2">
                <usersTrend.icon className={`h-4 w-4 mr-1 ${usersTrend.color}`} />
                <span className={`text-sm ${usersTrend.color}`}>
                  {usersTrend.value}% from last month
                </span>
              </div>
            </div>
            <UserGroupIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalClaims}</p>
              <div className="flex items-center mt-2">
                <claimsTrend.icon className={`h-4 w-4 mr-1 ${claimsTrend.color}`} />
                <span className={`text-sm ${claimsTrend.color}`}>
                  {claimsTrend.value}% from last month
                </span>
              </div>
            </div>
            <ClipboardDocumentListIcon className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.overview.totalItems > 0 
                  ? Math.round((analytics.overview.resolvedItems / analytics.overview.totalItems) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {analytics.overview.resolvedItems} of {analytics.overview.totalItems} resolved
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Categories Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Category</h3>
          <div className="space-y-4">
            {analytics.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-3" style={{
                    backgroundColor: `hsl(${(index * 360) / analytics.categories.length}, 70%, 50%)`
                  }} />
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{category.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(category.count / Math.max(...analytics.categories.map(c => c.count))) * 100}%`,
                        backgroundColor: `hsl(${(index * 360) / analytics.categories.length}, 70%, 50%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Locations</h3>
          <div className="space-y-4">
            {analytics.topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{location.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{location.count} items</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(location.count / Math.max(...analytics.topLocations.map(l => l.count))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === 'item' && <ShoppingBagIcon className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'user' && <UserGroupIcon className="h-4 w-4 text-green-600" />}
                      {activity.type === 'claim' && <ClipboardDocumentListIcon className="h-4 w-4 text-yellow-600" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Activity will appear here as users interact with the system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
