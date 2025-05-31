'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useNotifications } from '@/components/providers/NotificationProvider';
import Image from 'next/image';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Lost Items', href: '/items/lost' },
  { name: 'Found Items', href: '/items/found' },
  { name: 'My Dashboard', href: '/dashboard' },
  { name: 'Messages', href: '/chat/list' },
];

const userNavigation = [
  { name: 'Your Profile', href: '/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: session, status } = useSession();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const router = useRouter();

  // Initialize user status tracking
  useUserStatus();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setNotificationsOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="mx-auto  px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex mx-auto h-16 w-[90%] items-center justify-between">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
               
              <Image src="/logo.png" width={100} height={50} alt="logo" />


              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:block">
              <div className="flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

       

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                <div className="rounded-full bg-gray-200 h-8 w-8"></div>
              </div>
            ) : session ? (
              <>
                {/* Post item button */}
                <Link
                  href="/items/post"
                  className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded hidden sm:inline-flex"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Post Item
                </Link>

                {/* Notifications */}
                <Popover className="relative">
                  <Popover.Button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2">
                    <BellIcon className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-1 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-1 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Notifications
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={classNames(
                                'p-3 rounded-md cursor-pointer transition-colors',
                                notification.isRead
                                  ? 'bg-gray-50 hover:bg-gray-100'
                                  : 'bg-blue-50 hover:bg-blue-100'
                              )}
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No notifications yet
                            </p>
                          )}
                        </div>
                        {notifications.length > 5 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Link
                              href="/notifications"
                              className="text-sm text-gray-800 hover:text-gray-500"
                            >
                              View all notifications
                            </Link>
                          </div>
                        )}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </Popover>

                {/* User menu */}
                <Popover className="relative">
                  <Popover.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2">
                    {session.user.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.avatar}
                        alt={session.user.name}
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-1 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-1 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {session.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.user.email}
                          </p>
                        </div>

                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <item.icon className="h-4 w-4 mr-3 text-gray-400" />
                            {item.name}
                          </Link>
                        ))}

                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                          Sign out
                        </button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </Popover>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-500 hover:text-gray-900 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-black text-white hover:bg-gray-900 px-4 py-2 rounded"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <Dialog as="div" className="md:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-10" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="text-xl font-bold text-gray-900">UMT Lost & Found</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                {session && (
                  <div className="py-6">
                    <Link
                      href="/items/post"
                      className="btn-primary w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Post Item
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </nav>
    </header>
  );
}
