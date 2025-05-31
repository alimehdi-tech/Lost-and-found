'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAdmin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const createAdminUser = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Abdullah',
          email: 's2024376029@umt.edu.pk',
          password: 'admin123',
          studentId: 's2024376029'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        setError(data.error || 'Failed to create admin user');
      }
    } catch (error) {
      setError('An error occurred while creating admin user');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Admin User
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create admin user: Abdullah (s2024376029@umt.edu.pk)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {message}
                <p className="text-sm mt-2">Redirecting to sign in page...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Admin User Details:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Name:</strong> Abdullah</li>
                <li><strong>Email:</strong> s2024376029@umt.edu.pk</li>
                <li><strong>Student ID:</strong> s2024376029</li>
                <li><strong>Password:</strong> admin123</li>
                <li><strong>Role:</strong> Admin</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                ⚠️ Please change the password after first login!
              </p>
            </div>

            <button
              onClick={createAdminUser}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Admin User...' : 'Create Admin User'}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
