const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const crypto = require('crypto');

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * User Registration
 */
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password, firstName, lastName, role = 'STUDENT' } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        emailVerified: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate verification token (in production, send email)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);

    // Generate auth tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended or banned',
      });
    }

    // Check login attempts
    if (user.loginAttempts >= parseInt(process.env.MAX_LOGIN_ATTEMPTS || 5)) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: user.loginAttempts + 1 },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Update streak (if applicable)
    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = user.lastActivityDate?.toISOString().split('T')[0];
    
    let streakUpdate = {};
    if (!lastActivityDate || lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivityDate === yesterdayStr) {
        // Continue streak
        streakUpdate = {
          currentStreak: user.currentStreak + 1,
          longestStreak: Math.max(user.longestStreak, user.currentStreak + 1),
          lastActivityDate: new Date(),
        };
      } else {
        // Streak broken
        streakUpdate = {
          currentStreak: 1,
          lastActivityDate: new Date(),
        };
      }

      await prisma.user.update({
        where: { id: user.id },
        data: streakUpdate,
      });

      // Award daily login points
      await prisma.pointsTransaction.create({
        data: {
          userId: user.id,
          pointsAmount: 5,
          activityType: 'daily_login',
          description: 'Daily login bonus',
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { totalPoints: user.totalPoints + 5 },
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
      preferredLanguage: user.preferredLanguage,
      themePreference: user.themePreference,
      fontSize: user.fontSize,
      totalPoints: user.totalPoints + (streakUpdate.currentStreak ? 5 : 0),
      currentStreak: streakUpdate.currentStreak || user.currentStreak,
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * User Logout
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

/**
 * Refresh Token
 */
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const token = generateToken(decoded.userId);

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

/**
 * Forgot Password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // TODO: Store reset token in database and send email
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { token, password } = req.body;

    // TODO: Verify reset token from database
    // For now, return success
    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

/**
 * Verify Email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // TODO: Verify token and update user
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
};

/**
 * Get Current User
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePictureUrl: true,
        dateOfBirth: true,
        phoneNumber: true,
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        timezone: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        emailVerified: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
    });
  }
};
