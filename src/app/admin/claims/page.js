'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminImage from '@/components/admin/AdminImage';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';

export default function ClaimsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    timeRange: 'all'
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchClaims();
  }, [session, status, router]);

  useEffect(() => {
    filterClaims();
  }, [claims, searchTerm, filters]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/claims');
      const data = await response.json();
      
      if (response.ok) {
        setClaims(data.claims);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = claims.filter(claim => {
      const matchesSearch = claim.item?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.claimant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.claimant?.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || claim.status === filters.status;
      
      let matchesTimeRange = true;
      if (filters.timeRange !== 'all') {
        const now = new Date();
        const claimDate = new Date(claim.createdAt);
        const daysDiff = (now - claimDate) / (1000 * 60 * 60 * 24);
        
        switch (filters.timeRange) {
          case '1d':
            matchesTimeRange = daysDiff <= 1;
            break;
          case '7d':
            matchesTimeRange = daysDiff <= 7;
            break;
          case '30d':
            matchesTimeRange = daysDiff <= 30;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesTimeRange;
    });
    
    setFilteredClaims(filtered);
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
        fetchClaims();
        if (showClaimModal) {
          setShowClaimModal(false);
        }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
            <p className="mt-2 text-gray-600">
              Review and process item claims from users
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {claims.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {claims.filter(c => c.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {claims.filter(c => c.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search claims..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              className="form-select"
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            >
              <option value="all">All Time</option>
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ status: 'all', timeRange: 'all' });
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No claims found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No claims match your current filters.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div key={claim._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(claim.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(claim.createdAt)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Item Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Item: {claim.item?.title}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="font-medium w-20">Type:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              claim.item?.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {claim.item?.type}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-20">Location:</span>
                            <span>{claim.item?.location}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-20">Category:</span>
                            <span>{claim.item?.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Claimant Info */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-2">
                          Claimant Information
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>{claim.claimant?.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-16">Email:</span>
                            <span>{claim.claimant?.email}</span>
                          </div>
                          {claim.claimant?.studentId && (
                            <div className="flex items-center">
                              <span className="font-medium w-16">ID:</span>
                              <span>{claim.claimant?.studentId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Claim Description */}
                    {claim.description && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Claim Description:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {claim.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setShowClaimModal(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    
                    {claim.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleClaimAction(claim._id, 'approve')}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim._id, 'reject')}
                          className="btn btn-danger btn-sm"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Claim Detail Modal */}
      {showClaimModal && selectedClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowClaimModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">Claim Details</h3>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Item Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h4>
                    
                    {selectedClaim.item?.images && selectedClaim.item.images.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {selectedClaim.item.images.map((image, index) => (
                            <AdminImage
                              key={index}
                              src={image.url}
                              alt={`${selectedClaim.item.title} ${index + 1}`}
                              fill
                              className="h-32 rounded overflow-hidden"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Title:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.item?.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.item?.description}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Location:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.item?.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.item?.category}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Claim Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Claimant:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.claimant?.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">{selectedClaim.claimant?.email}</p>
                      </div>
                      {selectedClaim.claimant?.studentId && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Student ID:</span>
                          <p className="text-sm text-gray-900">{selectedClaim.claimant?.studentId}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-500">Claim Date:</span>
                        <p className="text-sm text-gray-900">{formatDate(selectedClaim.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedClaim.status)}`}>
                          {selectedClaim.status}
                        </span>
                      </div>
                      {selectedClaim.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Description:</span>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                            {selectedClaim.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {selectedClaim.status === 'pending' && (
                  <div className="mt-8 flex space-x-3">
                    <button
                      onClick={() => handleClaimAction(selectedClaim._id, 'approve')}
                      className="btn btn-success"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Approve Claim
                    </button>
                    <button
                      onClick={() => handleClaimAction(selectedClaim._id, 'reject')}
                      className="btn btn-danger"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Reject Claim
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
