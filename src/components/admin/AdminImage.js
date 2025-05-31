'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function AdminImage({ 
  src, 
  alt, 
  className = '', 
  fill = false, 
  width, 
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = (e) => {
    console.log('Image failed to load:', src, e);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', src);
    setImageLoading(false);
  };

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No Image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          onError={handleImageError}
          onLoad={handleImageLoad}
          unoptimized={true}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-cover"
          sizes={sizes}
          onError={handleImageError}
          onLoad={handleImageLoad}
          unoptimized={true}
        />
      )}
    </div>
  );
}
