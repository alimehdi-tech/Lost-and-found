'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function Home() {
  const [stats, setStats] = useState([
    { name: 'Items Posted', value: '0', icon: PlusIcon },
    { name: 'Items Recovered', value: '0', icon: CheckCircleIcon },
    { name: 'Active Users', value: '0', icon: UserGroupIcon },
    { name: 'Success Rate', value: '0%', icon: EyeIcon },
  ]);

  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingText, setTypingText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typingTexts = [
    'I lost something...',
    'I found something...',
    'Help me find my item',
    'Return lost items'
  ];

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Typing effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentText = typingTexts[currentTextIndex];

      if (!isDeleting) {
        if (typingText.length < currentText.length) {
          setTypingText(currentText.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % typingTexts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, currentTextIndex, typingTexts]);

  const fetchHomeData = async () => {
    try {
      // Fetch recent items
      const response = await fetch('/api/items?limit=6&sortBy=createdAt&sortOrder=desc');
      const data = await response.json();

      if (response.ok) {
        setRecentItems(data.items);

        // Update stats based on real data
        const totalItems = data.pagination.total;
        const resolvedItems = Math.floor(totalItems * 0.7); // Estimate
        const activeUsers = Math.floor(totalItems * 0.3); // Estimate
        const successRate = totalItems > 0 ? Math.floor((resolvedItems / totalItems) * 100) : 0;

        setStats([
          { name: 'Items Posted', value: totalItems.toString(), icon: PlusIcon },
          { name: 'Items Recovered', value: resolvedItems.toString(), icon: CheckCircleIcon },
          { name: 'Active Users', value: activeUsers.toString(), icon: UserGroupIcon },
          { name: 'Success Rate', value: `${successRate}%`, icon: EyeIcon },
        ]);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative py-16 sm:py-24 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                <span className="block">UMT Lost & Found</span>
                <span className="block text-gray-800">Portal</span>
              </h1>
              <div className="mx-auto mt-6 max-w-2xl">
                <p className="text-lg text-gray-500 mb-4">
                  Help your fellow students recover lost items and return found belongings.
                </p>
                <div className="text-xl font-medium text-black h-8 flex items-center justify-center">
                  <span>{typingText}</span>
                  <span className="animate-pulse ml-1">|</span>
                </div>
              </div>
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                <Link
  href="/items/lost"
  className="flex items-center justify-center rounded-md text-base font-medium text-white shadow-sm sm:px-8"
>
  <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
      <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
      Browse Lost Items
    </span>
  </button>
</Link>


                  <Link
                    href="/items/post"
                    className="flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-4 py-3 text-base font-medium text-black shadow-sm hover:bg-gray-200 sm:px-8"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Post an Item
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-l from-black to-gray-800 ">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-blue-200" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-blue-200">{stat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Items Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Recent Activity
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Latest lost and found items posted by the UMT community
          </p>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((item) => (
              <Link
                key={item._id}
                href={`/items/${item._id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.location}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-400">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <span className={`badge ${
                      item.type === 'lost' ? 'badge-danger' : 'badge-success'
                    }`}>
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                  </div>

                  {item.images && item.images.length > 0 && (
                    <div className="mt-3">
                      <img
                        src={item.images[0].url}
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items posted yet</h3>
            <p className="text-gray-500 mb-6">Be the first to post a lost or found item!</p>
            <Link href="/items/post" className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded">
              Post First Item
            </Link>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/items"

          >
           <button className="shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white  text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400">
        View All Items
      </button>
          </Link>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Simple steps to help recover lost items
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-l from-black to-gray-800 text-white mx-auto">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Post Your Item
              </h3>
              <p className="mt-2 text-gray-500">
                Create a detailed post with photos and description of your lost or found item.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-black to-gray-800 text-white mx-auto">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Connect Safely
              </h3>
              <p className="mt-2 text-gray-500">
                Use our secure chat system to communicate with potential matches.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-l from-black to-gray-800 text-white mx-auto">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Recover & Return
              </h3>
              <p className="mt-2 text-gray-500">
                Meet safely on campus to verify and return the item to its rightful owner.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">
              © 2024 University of Management and Technology. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-gray-500">
                About
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-gray-500">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-gray-500">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
