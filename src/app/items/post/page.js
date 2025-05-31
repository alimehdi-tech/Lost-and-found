'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PhotoIcon,
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import ImageSimilarityRecommendations from '@/components/features/ImageSimilarityRecommendations';

const categories = [
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

const commonLocations = [
  'Library 1st Floor',
  'Library 2nd Floor',
  'Library 3rd Floor',
  'Main Cafeteria',
  'Food Court',
  'Lecture Hall 1',
  'Lecture Hall 2',
  'Computer Lab',
  'Main Gate',
  'Parking Area',
  'Sports Complex',
  'Auditorium',
  'Admin Block',
  'Student Center'
];

export default function PostItem() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'lost',
    location: '',
    dateOccurred: '',
    contactInfo: {
      email: session?.user?.email || '',
      phone: '',
      preferredContact: 'email'
    },
    tags: '',
    isUrgent: false,
    reward: {
      offered: false,
      amount: '',
      description: ''
    }
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState(0);

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
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 5) {
      setError('You can upload maximum 5 images');
      return;
    }

    setError(''); // Clear any previous errors

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      try {
        const base64 = await convertToBase64(file);
        const imageData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        };

        setImages(prev => [...prev, imageData]);
        setImagePreviews(prev => [...prev, base64]);

        // Show recommendations after first image is uploaded
        if (images.length === 0) {
          setShowRecommendations(true);
        }
      } catch (err) {
        setError('Failed to process image: ' + file.name);
        console.error('Image processing error:', err);
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

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
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

    const selectedDate = new Date(formData.dateOccurred);
    const today = new Date();
    if (selectedDate > today) {
      setError('Date cannot be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare images for upload
      const processedImages = images.map(img => ({
        name: img.name,
        type: img.type,
        size: img.size,
        data: img.data
      }));

      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        images: processedImages
      };

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSuccess('Item posted successfully!');
        setTimeout(() => {
          router.push(`/items/${data.item._id}`);
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post an Item</h1>
          <p className="mt-2 text-gray-600">
            Help the UMT community by posting lost or found items
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </div>
            <div className="card-body space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Item Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="lost"
                      checked={formData.type === 'lost'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'lost'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">😢</div>
                        <div className="font-medium">Lost Item</div>
                        <div className="text-sm text-gray-500">I lost something</div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="found"
                      checked={formData.type === 'found'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'found'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎉</div>
                        <div className="font-medium">Found Item</div>
                        <div className="text-sm text-gray-500">I found something</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="form-input mt-1"
                  placeholder="e.g., iPhone 13 Pro, Blue Water Bottle, Student ID Card"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="form-select mt-1"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  className="form-textarea mt-1"
                  placeholder="Provide detailed description including color, brand, size, distinctive features..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Location and Date */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Location & Date</h3>
            </div>
            <div className="card-body space-y-6">
              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  <MapPinIcon className="inline h-4 w-4 mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  list="locations"
                  className="form-input mt-1"
                  placeholder="Where was it lost/found?"
                  value={formData.location}
                  onChange={handleInputChange}
                />
                <datalist id="locations">
                  {commonLocations.map(location => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="dateOccurred" className="block text-sm font-medium text-gray-700">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Date {formData.type === 'lost' ? 'Lost' : 'Found'} *
                </label>
                <input
                  type="date"
                  id="dateOccurred"
                  name="dateOccurred"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="form-input mt-1"
                  value={formData.dateOccurred}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Images</h3>
              <p className="text-sm text-gray-500">Upload up to 5 images (max 5MB each)</p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="images" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload images
                        </span>
                        <input
                          id="images"
                          name="images"
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            </div>
            <div className="card-body space-y-6">
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  <TagIcon className="inline h-4 w-4 mr-1" />
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  className="form-input mt-1"
                  placeholder="e.g., black, leather, apple, small (separate with commas)"
                  value={formData.tags}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Add keywords to help others find your item
                </p>
              </div>

              {/* Contact Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Contact Information
                </label>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactInfo.email"
                      className="form-input mt-1"
                      value={formData.contactInfo.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm text-gray-600">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactInfo.phone"
                      className="form-input mt-1"
                      placeholder="+92 300 1234567"
                      value={formData.contactInfo.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Urgent Flag */}
              <div className="flex items-center">
                <input
                  id="isUrgent"
                  name="isUrgent"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.isUrgent}
                  onChange={handleInputChange}
                />
                <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                  Mark as urgent (important documents, keys, etc.)
                </label>
              </div>

              {/* Reward (for lost items) */}
              {formData.type === 'lost' && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="rewardOffered"
                      name="reward.offered"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.reward.offered}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="rewardOffered" className="ml-2 block text-sm text-gray-900">
                      Offer a reward
                    </label>
                  </div>

                  {formData.reward.offered && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label htmlFor="rewardAmount" className="block text-sm text-gray-600">
                          Reward Amount (Optional)
                        </label>
                        <input
                          type="number"
                          id="rewardAmount"
                          name="reward.amount"
                          min="0"
                          className="form-input mt-1"
                          placeholder="Amount in PKR"
                          value={formData.reward.amount}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="rewardDescription" className="block text-sm text-gray-600">
                          Reward Description
                        </label>
                        <input
                          type="text"
                          id="rewardDescription"
                          name="reward.description"
                          className="form-input mt-1"
                          placeholder="e.g., Cash reward, Gift card, etc."
                          value={formData.reward.description}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI-Powered Similar Items Check */}
          {showRecommendations && imagePreviews.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    🤖 AI Similarity Check
                  </h3>
                  {recommendationCount > 0 && (
                    <span className="badge badge-warning">
                      {recommendationCount} similar items found
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Before posting, check if someone has already posted a similar item
                </p>
              </div>
              <div className="card-body">
                <ImageSimilarityRecommendations
                  imageUrl={imagePreviews[0]}
                  itemType={formData.type}
                  category={formData.category}
                  onRecommendationsFound={(count) => {
                    setRecommendationCount(count);
                  }}
                />
              </div>
            </div>
          )}

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
              disabled={loading}
              className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </div>
              ) : (
                `Post ${formData.type === 'lost' ? 'Lost' : 'Found'} Item`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
