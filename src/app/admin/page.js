'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArchiveBoxIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    resolvedItems: 0,
    totalUsers: 0,
    pendingClaims: 0,
    totalViews: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    timeRange: '7d'
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchAdminData();
  }, [session, status, router]);

  const fetchAdminData = async () => {
    try {
      // Fetch all items for admin overview
      const itemsResponse = await fetch('/api/admin/items');
      const itemsData = await itemsResponse.json();
      
      if (itemsResponse.ok) {
        const items = itemsData.items;
        const activeItems = items.filter(item => item.status === 'active').length;
        const resolvedItems = items.filter(item => item.status === 'resolved').length;
        const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalItems: items.length,
          activeItems,
          resolvedItems,
          totalViews
        }));
        
        setRecentItems(items.slice(0, 10));
      }

      // Fetch pending claims
      const claimsResponse = await fetch('/api/admin/claims?status=pending');
      const claimsData = await claimsResponse.json();
      
      if (claimsResponse.ok) {
        setPendingClaims(claimsData.claims);
        setStats(prev => ({
          ...prev,
          pendingClaims: claimsData.claims.length
        }));
      }

      // Fetch user count
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();
      
      if (usersResponse.ok) {
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.total
        }));
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemAction = async (itemId, action) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleClaimAction = async (claimId, action) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating claim:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage lost and found items, claims, and user activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
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
                  <p className="text-sm font-medium text-gray-500">Active Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeItems}</p>
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
                  <p className="text-sm font-medium text-gray-500">Resolved Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolvedItems}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Claims</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Items */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Items</h3>
                <div className="flex items-center space-x-2">
                  <select
                    className="form-select text-sm"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentItems.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.title}
                          </h4>
                          <span className={`badge ${
                            item.type === 'lost' ? 'badge-danger' : 'badge-success'
                          }`}>
                            {item.type}
                          </span>
                          <span className={`badge ${
                            item.status === 'active' ? 'badge-warning' : 
                            item.status === 'resolved' ? 'badge-success' : 'badge-info'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.location} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        {item.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleItemAction(item._id, 'resolve')}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleItemAction(item._id, 'archive')}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Claims */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Pending Claims</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingClaims.length > 0 ? (
                  pendingClaims.map((claim) => (
                    <div key={claim._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {claim.item?.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Claimed by: {claim.claimant?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(claim.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleClaimAction(claim._id, 'approve')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim._id, 'reject')}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending claims</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All claims have been processed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
