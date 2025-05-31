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

export default function ClaimItem() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    message: '',
    proofImages: [],
    verificationAnswers: []
  });

  const [imagePreviews, setImagePreviews] = useState([]);

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
        // Initialize verification questions
        if (data.item.type === 'found') {
          setFormData(prev => ({
            ...prev,
            verificationAnswers: [
              { question: 'What color is the item?', answer: '' },
              { question: 'Where exactly did you lose it?', answer: '' },
              { question: 'What brand is it (if applicable)?', answer: '' }
            ]
          }));
        }
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVerificationChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      verificationAnswers: prev.verificationAnswers.map((qa, i) => 
        i === index ? { ...qa, answer: value } : qa
      )
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + formData.proofImages.length > 3) {
      setError('You can upload maximum 3 proof images');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      proofImages: [...prev.proofImages, ...files]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      proofImages: prev.proofImages.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.message.trim()) {
      setError('Please provide a detailed message explaining why this item belongs to you');
      return false;
    }

    if (item.type === 'found') {
      const unansweredQuestions = formData.verificationAnswers.filter(qa => !qa.answer.trim());
      if (unansweredQuestions.length > 0) {
        setError('Please answer all verification questions');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: id,
          message: formData.message,
          verificationAnswers: formData.verificationAnswers,
          // In production, you'd upload images first
          proofImages: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSuccess('Claim request submitted successfully! The item owner will be notified.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button onClick={() => router.back()} className="btn-primary">
              Go Back
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Claim Item</h1>
          <p className="mt-2 text-gray-600">
            Submit a claim request for "{item?.title}"
          </p>
        </div>

        {/* Item Summary */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-start space-x-4">
              {item?.images && item.images.length > 0 ? (
                <img
                  src={item.images[0].url}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item?.title}</h3>
                <p className="text-gray-600 mt-1">{item?.description}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Found at: {item?.location}</span>
                  <span>•</span>
                  <span>{item?.category}</span>
                </div>
              </div>
            </div>
          </div>
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

          {/* Claim Message */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Why is this your item?</h3>
            </div>
            <div className="card-body">
              <textarea
                name="message"
                rows={4}
                required
                className="form-textarea border-gray-300 rounded-md shadow-sm"
                placeholder="Please provide detailed information about why this item belongs to you. Include specific details that only the owner would know..."
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Verification Questions */}
          {item?.type === 'found' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Verification Questions</h3>
                <p className="text-sm text-gray-500">Answer these questions to help verify ownership</p>
              </div>
              <div className="card-body space-y-4">
                {formData.verificationAnswers.map((qa, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {qa.question} *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input border-gray-300"
                      placeholder="Your answer..."
                      value={qa.answer}
                      onChange={(e) => handleVerificationChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof Images */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Proof Images (Optional)</h3>
              <p className="text-sm text-gray-500">Upload images that prove ownership (receipts, similar items, etc.)</p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="proofImages" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload proof images
                        </span>
                        <input
                          id="proofImages"
                          name="proofImages"
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each (max 3 images)</p>
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
                          alt={`Proof ${index + 1}`}
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
              disabled={submitting}
              className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Claim...
                </div>
              ) : (
                'Submit Claim Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
