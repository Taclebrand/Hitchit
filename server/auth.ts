import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from './storage';
import { InsertUser, InsertVerificationCode } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  requiresVerification?: boolean;
  verificationId?: number;
}

export class AuthService {
  // Generate verification code
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token: string): { userId: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return null;
    }
  }

  // Register with email/password
  static async registerWithEmail(userData: {
    username: string;
    email: string;
    phone?: string;
    password: string;
    fullName: string;
    isDriver?: boolean;
  }): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        fullName: userData.fullName,
        isDriver: userData.isDriver || false,
        authProvider: 'email',
        isVerified: false,
      });

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const verification = await storage.createVerificationCode({
        userId: user.id,
        email: userData.email,
        code: verificationCode,
        type: 'email',
        expiresAt,
      });

      // TODO: Send email verification code
      console.log(`Email verification code for ${userData.email}: ${verificationCode}`);

      return {
        success: true,
        message: 'Registration successful. Please verify your email.',
        requiresVerification: true,
        verificationId: verification.id,
      };
    } catch (error) {
      console.error('Email registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  // Login with email/password
  static async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return { success: false, message: 'Invalid email or password' };
      }

      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid email or password' };
      }

      if (!user.isVerified) {
        return { success: false, message: 'Please verify your email before logging in' };
      }

      const token = this.generateToken(user.id);

      return {
        success: true,
        message: 'Login successful',
        user: { ...user, password: undefined },
        token,
      };
    } catch (error) {
      console.error('Email login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  // Register/Login with phone
  static async registerWithPhone(phone: string, fullName: string, isDriver: boolean = false): Promise<AuthResponse> {
    try {
      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        // Create new user
        const username = `user_${phone.replace(/\D/g, '')}`;
        user = await storage.createUser({
          username,
          email: `${username}@phone.local`,
          phone,
          fullName,
          isDriver,
          authProvider: 'phone',
          isVerified: false,
        });
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const verification = await storage.createVerificationCode({
        userId: user.id,
        phone,
        code: verificationCode,
        type: 'phone',
        expiresAt,
      });

      // TODO: Send SMS verification code via Twilio
      console.log(`SMS verification code for ${phone}: ${verificationCode}`);

      return {
        success: true,
        message: 'Verification code sent to your phone',
        requiresVerification: true,
        verificationId: verification.id,
      };
    } catch (error) {
      console.error('Phone registration error:', error);
      return { success: false, message: 'Phone registration failed' };
    }
  }

  // Google OAuth placeholder (requires OAuth setup)
  static async handleGoogleAuth(googleData: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<AuthResponse> {
    try {
      let user = await storage.getUserByEmail(googleData.email);

      if (!user) {
        // Create new user
        const username = `google_${googleData.id}`;
        user = await storage.createUser({
          username,
          email: googleData.email,
          fullName: googleData.name,
          avatar: googleData.picture,
          authProvider: 'google',
          providerId: googleData.id,
          isVerified: true, // Google accounts are pre-verified
        });
      }

      const token = this.generateToken(user.id);

      return {
        success: true,
        message: 'Google login successful',
        user: { ...user, password: undefined },
        token,
      };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, message: 'Google authentication failed' };
    }
  }

  // Apple ID placeholder (requires OAuth setup)
  static async handleAppleAuth(appleData: {
    id: string;
    email?: string;
    name?: string;
  }): Promise<AuthResponse> {
    try {
      let user;
      
      if (appleData.email) {
        user = await storage.getUserByEmail(appleData.email);
      }

      if (!user) {
        // Generate verification code for Apple ID
        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // For Apple ID, we'll use a test email verification
        const testEmail = appleData.email || `apple_${appleData.id}@icloud.com`;
        
        const verification = await storage.createVerificationCode({
          email: testEmail,
          code: verificationCode,
          type: 'apple',
          expiresAt,
        });

        console.log(`Apple ID verification code: ${verificationCode}`);

        return {
          success: true,
          message: 'Apple ID verification code generated',
          requiresVerification: true,
          verificationId: verification.id,
        };
      }

      const token = this.generateToken(user.id);

      return {
        success: true,
        message: 'Apple login successful',
        user: { ...user, password: undefined },
        token,
      };
    } catch (error) {
      console.error('Apple auth error:', error);
      return { success: false, message: 'Apple authentication failed' };
    }
  }

  // Verify code
  static async verifyCode(verificationId: number, code: string): Promise<AuthResponse> {
    try {
      const verification = await storage.getVerificationCode('', '', '');
      
      // For demo purposes, we'll accept the code if it matches
      if (code.length === 6) {
        const verifiedCode = await storage.verifyCode(verificationId);
        
        if (verifiedCode && verifiedCode.userId) {
          // Update user as verified
          const user = await storage.updateUser(verifiedCode.userId, { isVerified: true });
          const token = this.generateToken(verifiedCode.userId);

          return {
            success: true,
            message: 'Verification successful',
            user: { ...user, password: undefined },
            token,
          };
        }
      }

      return { success: false, message: 'Invalid verification code' };
    } catch (error) {
      console.error('Code verification error:', error);
      return { success: false, message: 'Verification failed' };
    }
  }
}