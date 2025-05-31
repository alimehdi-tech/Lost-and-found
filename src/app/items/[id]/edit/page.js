'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function EditItem() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'lost',
    category: '',
    description: '',
    location: '',
    dateOccurred: '',
    contactInfo: {
      email: '',
      phone: ''
    },
    tags: [],
    isUrgent: false,
    reward: {
      offered: false,
      amount: '',
      description: ''
    }
  });

  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    'Electronics', 'Books', 'Clothing', 'Accessories', 'Documents',
    'Keys', 'Bags', 'Sports Equipment', 'Jewelry', 'Other'
  ];

  const locations = [
    'Library', 'Cafeteria', 'Parking Lot', 'Classroom Building',
    'Sports Complex', 'Auditorium', 'Computer Lab', 'Garden Area',
    'Main Gate', 'Other'
  ];

  useEffect(() => {
    if (session && id) {
      fetchItem();
    }
  }, [session, id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${id}`);
      const data = await response.json();

      if (response.ok) {
        const item = data.item;

        // Check if user owns this item
        if (item.postedBy._id !== session.user.id) {
          router.push(`/items/${id}`);
          return;
        }

        setFormData({
          title: item.title || '',
          type: item.type || 'lost',
          category: item.category || '',
          description: item.description || '',
          location: item.location || '',
          dateOccurred: item.dateOccurred ? new Date(item.dateOccurred).toISOString().split('T')[0] : '',
          contactInfo: {
            email: item.contactInfo?.email || '',
            phone: item.contactInfo?.phone || ''
          },
          tags: item.tags || [],
          isUrgent: item.isUrgent || false,
          reward: {
            offered: item.reward?.offered || false,
            amount: item.reward?.amount || '',
            description: item.reward?.description || ''
          }
        });

        setImages(item.images || []);
      } else {
        setError(data.error || 'Item not found');
      }
    } catch (error) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    setError('');
    setSuccess('');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const totalImages = images.length + newImages.length + files.length;

    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }

      try {
        const base64 = await convertToBase64(file);
        setNewImages(prev => [...prev, {
          url: base64,
          filename: file.name,
          isNew: true
        }]);
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    const imageToRemove = images[index];
    setImagesToDelete(prev => [...prev, imageToRemove]);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!formData.dateOccurred) {
      setError('Date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        ...formData,
        newImages: newImages,
        imagesToDelete: imagesToDelete
      };

      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update item');
      } else {
        setSuccess('Item updated successfully!');
        setTimeout(() => {
          router.push(`/items/${id}`);
        }, 1500);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">Please log in to edit items.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
          <p className="mt-2 text-gray-600">
            Update your item information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <div className="text-sm text-green-700">{success}</div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="form-input border-gray-300"
                  placeholder="e.g., iPhone 13 Pro, Blue Backpack, etc."
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="form-select border-gray-300"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="form-select border-gray-300"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  className="form-textarea border-gray-300"
                  placeholder="Provide detailed description of the item..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    id="location"
                    name="location"
                    required
                    className="form-select border-gray-300"
                    value={formData.location}
                    onChange={handleInputChange}
                  >
                    <option value="">Select location</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dateOccurred" className="block text-sm font-medium text-gray-700 mb-1">
                    Date {formData.type === 'lost' ? 'Lost' : 'Found'} *
                  </label>
                  <input
                    type="date"
                    id="dateOccurred"
                    name="dateOccurred"
                    required
                    className="form-input border-gray-300"
                    value={formData.dateOccurred}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Images</h3>
              <p className="text-sm text-gray-500">Upload up to 5 images (max 5MB each)</p>
            </div>
            <div className="card-body space-y-4">
              {/* Current Images */}
              {images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`Current ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {(images.length + newImages.length) < 5 && (
                <div>
                  <label htmlFor="images" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-900">Upload images</span>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                      </div>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Tags</h3>
              <p className="text-sm text-gray-500">Add tags to help others find your item</p>
            </div>
            <div className="card-body space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="form-input flex-1 border-gray-300"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Additional Options</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <input
                  id="isUrgent"
                  name="isUrgent"
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                  checked={formData.isUrgent}
                  onChange={handleInputChange}
                />
                <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                  Mark as urgent
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="rewardOffered"
                    name="reward.offered"
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    checked={formData.reward.offered}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="rewardOffered" className="ml-2 block text-sm text-gray-900">
                    Offer reward
                  </label>
                </div>

                {formData.reward.offered && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label htmlFor="rewardAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Amount (PKR)
                      </label>
                      <input
                        type="number"
                        id="rewardAmount"
                        name="reward.amount"
                        className="form-input border-gray-300"
                        placeholder="e.g., 1000"
                        value={formData.reward.amount}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Description
                      </label>
                      <textarea
                        id="rewardDescription"
                        name="reward.description"
                        rows={2}
                        className="form-textarea border-gray-300"
                        placeholder="Describe the reward..."
                        value={formData.reward.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
