'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import ImageSimilarityRecommendations from '@/components/features/ImageSimilarityRecommendations';

export default function ItemDetail() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${id}`);
      const data = await response.json();

      if (response.ok) {
        setItem(data.item);
        // Increment view count
        incrementViews();
      } else {
        setError(data.error || 'Item not found');
      }
    } catch (error) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await fetch(`/api/items/${id}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  const handleClaim = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    router.push(`/items/${id}/claim`);
  };

  const handleContact = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    router.push(`/chat?item=${id}&user=${item.postedBy._id}`);
  };

  const handleEdit = () => {
    router.push(`/items/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/items" className="btn-primary">
              Browse Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link
                href={`/items/${item.type}`}
                className="text-gray-400 hover:text-gray-500"
              >
                {item.type === 'lost' ? 'Lost Items' : 'Found Items'}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900">{item.title}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-body">
                {item.images && item.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-w-16 aspect-h-12">
                      <img
                        src={item.images[selectedImage]?.url || '/placeholder-image.jpg'}
                        alt={item.title}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </div>

                    {/* Thumbnail Images */}
                    {item.images.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto">
                        {item.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                              selectedImage === index
                                ? 'border-blue-500'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={`${item.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl text-gray-400 mb-2">📷</div>
                      <p className="text-gray-500">No images available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center mb-2">
                      <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Item Details & Actions */}
          <div className="space-y-6">
            {/* Item Info */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${
                      item.type === 'lost' ? 'badge-danger' : 'badge-success'
                    }`}>
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    {item.isUrgent && (
                      <span className="badge badge-warning">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{item.type === 'lost' ? 'Lost at' : 'Found at'}: {item.location}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{item.type === 'lost' ? 'Lost on' : 'Found on'}: {formatDate(item.dateOccurred)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    <span>{item.views || 0} views</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <span className="badge badge-info">{item.category}</span>
                  </div>
                </div>

                {item.reward?.offered && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">💰 Reward Offered</span>
                    </div>
                    {item.reward.amount && (
                      <p className="text-sm text-green-700 mt-1">
                        Amount: PKR {item.reward.amount}
                      </p>
                    )}
                    {item.reward.description && (
                      <p className="text-sm text-green-700 mt-1">
                        {item.reward.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Posted By */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Posted By</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center">
                  {item.postedBy.avatar ? (
                    <img
                      src={item.postedBy.avatar}
                      alt={item.postedBy.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {item.postedBy.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.postedBy.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Posted {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {session && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                </div>
                <div className="card-body space-y-3">
                  {session.user.id === item.postedBy._id ? (
                    // Owner actions
                    <>
                      <button
                        onClick={handleEdit}
                        className="btn-primary w-full"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Item
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="btn-danger w-full"
                      >
                        {deleting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </div>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Item
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    // Other user actions
                    <>
                      {item.type === 'found' ? (
                        <button
                          onClick={handleClaim}
                          className="btn-primary w-full"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Claim This Item
                        </button>
                      ) : (
                        <button
                         onClick={() => router.push(`/chat?itemId=${id}&otherUserId=${item.postedBy._id}`)}
                          className="btn-primary w-full"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          I Found This Item
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/chat?itemId=${id}&otherUserId=${item.postedBy._id}`)}
                        className="btn-secondary w-full"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                        Send Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info (if available) */}
            {item.contactInfo && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                </div>
                <div className="card-body space-y-2">
                  {item.contactInfo.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      <a
                        href={`mailto:${item.contactInfo.email}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {item.contactInfo.email}
                      </a>
                    </div>
                  )}

                  {item.contactInfo.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <a
                        href={`tel:${item.contactInfo.phone}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {item.contactInfo.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI-Powered Similar Items Recommendations */}
        {item.images && item.images.length > 0 && (
          <ImageSimilarityRecommendations
            imageUrl={item.images[0].url}
            itemType={item.type}
            category={item.category}
            excludeItemId={item._id}
            onRecommendationsFound={(count) => {
              console.log(`Found ${count} similar items`);
            }}
          />
        )}
      </div>
    </div>
  );
}
