'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SparklesIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getImageSimilarityService } from '@/lib/imageSimilarity';

export default function ImageSimilarityRecommendations({ 
  imageUrl, 
  itemType, 
  category, 
  excludeItemId,
  onRecommendationsFound 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingMethod, setProcessingMethod] = useState('client'); // 'client' or 'server'

  useEffect(() => {
    if (imageUrl) {
      findSimilarItems();
    }
  }, [imageUrl, itemType, category]);

  const findSimilarItems = async () => {
    if (!imageUrl) return;

    setLoading(true);
    setError('');

    try {
      if (processingMethod === 'client') {
        await findSimilarItemsClient();
      } else {
        await findSimilarItemsServer();
      }
    } catch (error) {
      console.error('Error finding similar items:', error);
      setError('Failed to find similar items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findSimilarItemsClient = async () => {
    // First, get items to compare against
    const response = await fetch(`/api/items/similarity?type=${itemType}&category=${category || 'all'}&excludeItemId=${excludeItemId || ''}&limit=20`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch items');
    }

    if (data.items.length === 0) {
      setRecommendations([]);
      onRecommendationsFound?.(0);
      return;
    }

    // Use client-side image similarity service
    const similarityService = getImageSimilarityService();
    if (!similarityService) {
      // Fallback to server-side processing
      await findSimilarItemsServer();
      return;
    }

    const similarItems = await similarityService.findSimilarItems(
      imageUrl, 
      data.items, 
      0.3 // similarity threshold
    );

    setRecommendations(similarItems.slice(0, 6)); // Show top 6 recommendations
    onRecommendationsFound?.(similarItems.length);
  };

  const findSimilarItemsServer = async () => {
    const response = await fetch('/api/items/similarity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        itemType,
        category,
        excludeItemId,
        limit: 6
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to find similar items');
    }

    setRecommendations(data.similarItems || []);
    onRecommendationsFound?.(data.similarItems?.length || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSimilarityPercentage = (similarity) => {
    return Math.round(similarity * 100);
  };

  if (!imageUrl) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Powered Similar Items
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setProcessingMethod(processingMethod === 'client' ? 'server' : 'client')}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Mode: {processingMethod}
          </button>
          
          <button
            onClick={findSimilarItems}
            disabled={loading}
            className="btn-secondary text-sm"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                Analyzing...
              </div>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing image and finding similar items...</p>
          <p className="text-xs text-gray-500 mt-1">
            Using {processingMethod === 'client' ? 'client-side AI' : 'server-side analysis'}
          </p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={findSimilarItems} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <div className="text-center py-8">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Similar Items Found</h4>
          <p className="text-gray-600">
            We couldnot find any visually similar items at the moment. 
            Try adjusting your search criteria or check back later.
          </p>
        </div>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div>
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              <SparklesIcon className="h-4 w-4 inline mr-1" />
              Found {recommendations.length} visually similar {itemType === 'lost' ? 'found' : 'lost'} items using AI image analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <Link
                key={rec.item._id}
                href={`/items/${rec.item._id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  {/* Similarity Score */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(rec.confidence)}`}>
                      {getSimilarityPercentage(rec.similarity)}% match
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {rec.item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="mb-3">
                    {rec.matchedImage ? (
                      <img
                        src={rec.matchedImage}
                        alt={rec.item.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
                    {rec.item.title}
                  </h4>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {rec.item.description}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {rec.item.location}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatDate(rec.item.createdAt)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {rec.item.views || 0} views
                      </div>
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        Contact
                      </div>
                    </div>
                  </div>

                  {/* Match Factors (for debugging/transparency) */}
                  {rec.factors && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Match factors: {rec.factors.map(f => f.type).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Recommendations powered by AI image analysis. 
              Results are based on visual similarity, color patterns, and metadata matching.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
