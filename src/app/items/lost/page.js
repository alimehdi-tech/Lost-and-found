'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

const categories = [
  'All Categories',
  'Electronics',
  'Books & Stationery',
  'Clothing & Accessories',
  'ID Cards & Documents',
  'Keys',
  'Water Bottles',
  'Bags & Backpacks',
  'Sports Equipment',
  'Jewelry',
  'Other'
];

export default function LostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: 'lost',
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category !== 'All Categories') queryParams.append('category', filters.category);
      if (filters.location) queryParams.append('location', filters.location);

      const response = await fetch(`/api/items?${queryParams}`);
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

  useEffect(() => {
    fetchItems();
  }, [pagination.page]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchItems();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lost Items</h1>
          <p className="mt-2 text-gray-600">
            Browse items that fellow students have lost on campus
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, description, or tags..."
                    className="form-input pl-10 border-gray-300"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Library, Cafeteria"
                  className="form-input"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Date Posted</option>
                  <option value="dateOccurred">Date Lost</option>
                  <option value="title">Title</option>
                  <option value="views">Most Viewed</option>
                </select>
                <select
                  className="form-select"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <button type="submit" className="flex items-center bg-black text-white hover:bg-gray-900 px-4 py-2 rounded">
                <FunnelIcon className="h-4 w-4 mr-2" />
                  Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Link
                  key={item._id}
                  href={`/items/${item._id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {item.title}
                      </h3>
                      {item.isUrgent && (
                        <span className="badge badge-danger">Urgent</span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {item.images && item.images.length > 0 && (
                      <div className="mb-3">
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {item.location}
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Lost {formatDate(item.dateOccurred)}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="badge badge-info">
                          {item.category}
                        </span>

                        <div className="flex items-center text-xs text-gray-400">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {item.views || 0} views
                        </div>
                      </div>
                    </div>

                    {item.reward?.offered && (
                      <div className="mt-3 p-2 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700 font-medium">
                          💰 Reward Offered
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lost items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
