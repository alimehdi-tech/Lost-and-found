'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminImage from '@/components/admin/AdminImage';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  XMarkIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';

export default function ItemsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const categories = [
    'Electronics', 'Clothing', 'Books', 'Accessories', 'Documents', 
    'Sports Equipment', 'Bags', 'Jewelry', 'Keys', 'Other'
  ];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchItems();
  }, [session, status, router, pagination.page]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/items?page=${pagination.page}&limit=${pagination.limit}`);
      const data = await response.json();
      
      if (response.ok) {
        setItems(data.items);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filters.type === 'all' || item.type === filters.type;
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      
      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
    
    setFilteredItems(filtered);
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
        fetchItems();
        if (showItemModal) {
          setShowItemModal(false);
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
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
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Items Management</h1>
            <p className="mt-2 text-gray-600">
              Manage lost and found items, review submissions, and moderate content
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ type: 'all', status: 'all', category: 'all' });
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Item Image */}
            <div className="relative">
              <AdminImage
                src={item.images && item.images.length > 0 ? item.images[0].url : null}
                alt={item.title}
                fill
                className="h-48"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.type === 'lost'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.type}
                </span>
              </div>

              <div className="absolute top-2 right-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.status === 'active'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Item Details */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {item.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {item.location}
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(item.createdAt)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  By: {item.postedBy?.name || 'Unknown'}
                </span>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  
                  {item.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleItemAction(item._id, 'resolve')}
                        className="text-green-600 hover:text-green-800"
                        title="Mark as Resolved"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleItemAction(item._id, 'archive')}
                        className="text-gray-600 hover:text-gray-800"
                        title="Archive"
                      >
                        <ArchiveBoxIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowItemModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">Item Details</h3>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Item images */}
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.images.map((image, index) => (
                        <AdminImage
                          key={index}
                          src={image.url}
                          alt={`${selectedItem.title} ${index + 1}`}
                          fill
                          className="h-48 rounded-lg overflow-hidden"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Item details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedItem.title}</h4>
                    <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p className="text-sm text-gray-900">{selectedItem.type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <p className="text-sm text-gray-900">{selectedItem.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-sm text-gray-900">{selectedItem.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <p className="text-sm text-gray-900">{selectedItem.status}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Posted by:</span>
                      <p className="text-sm text-gray-900">{selectedItem.postedBy?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date:</span>
                      <p className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                  </div>
                  
                  {selectedItem.contactInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact Info:</span>
                      <p className="text-sm text-gray-900">{selectedItem.contactInfo}</p>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  {selectedItem.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleItemAction(selectedItem._id, 'resolve')}
                        className="btn btn-success"
                      >
                        Mark as Resolved
                      </button>
                      <button
                        onClick={() => handleItemAction(selectedItem._id, 'archive')}
                        className="btn btn-secondary"
                      >
                        Archive
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
