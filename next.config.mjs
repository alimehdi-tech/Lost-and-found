/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com', // Cloudinary
      'images.unsplash.com', // Unsplash
      'lh3.googleusercontent.com', // Google
      's3.amazonaws.com', // AWS S3
      'cdn.pixabay.com', // Pixabay
      // Add your actual image domains here
    ],
  },
};

export default nextConfig;
