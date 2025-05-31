import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth';
import connectDB from './db';
import User from '@/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('No user found with this email');
        }

        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        if (!user.isVerified) {
          throw new Error('Please verify your email before logging in');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          avatar: user.avatar
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.studentId = user.studentId;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.studentId = token.studentId;
        session.user.avatar = token.avatar;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Utility functions for authentication
export const validateUMTEmail = (email) => {
  const umtDomains = ['@umt.edu.pk', '@student.umt.edu.pk'];
  return umtDomains.some(domain => email.endsWith(domain));
};

export const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Role-based access control
export const requireAuth = (handler, requiredRole = null) => {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (requiredRole && session.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.user = session.user;
    return handler(req, res);
  };
};

// Check if user is admin
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

// Check if user owns the resource
export const isOwner = (user, resourceUserId) => {
  return user?.id === resourceUserId.toString();
};

// Check if user can access resource
export const canAccess = (user, resourceUserId, requiredRole = null) => {
  if (requiredRole && user?.role !== requiredRole) {
    return false;
  }

  return isAdmin(user) || isOwner(user, resourceUserId);
};
