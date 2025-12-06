const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const prisma = require('../utils/prisma');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        dateOfBirth: true,
        phoneNumber: true,
        bio: true,
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        timezone: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, upload.single('profilePicture'), async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, dateOfBirth, bio } = req.body;
    const userId = req.user.id;

    // Prepare update data
    const updateData = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim() || null;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (bio !== undefined) updateData.bio = bio.trim() || null;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePictureUrl: true }
      });

      if (currentUser.profilePictureUrl) {
        const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(currentUser.profilePictureUrl));
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      // Set new profile picture URL
      updateData.profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        dateOfBirth: true,
        phoneNumber: true,
        bio: true,
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Delete uploaded file if update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// Update user preferences (theme, font size, etc.)
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { preferredLanguage, themePreference, fontSize, timezone } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
    if (themePreference) updateData.themePreference = themePreference;
    if (fontSize) updateData.fontSize = fontSize;
    if (timezone) updateData.timezone = timezone;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        timezone: true,
      }
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: updatedUser }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        timezone: true,
      }
    });

    res.json({
      success: true,
      data: { preferences: user }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences'
    });
  }
});

// Change password
router.put('/profile/password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Upload profile picture
router.post('/profile/picture', authenticate, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old profile picture if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true }
    });

    if (currentUser.profilePictureUrl) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(currentUser.profilePictureUrl));
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    // Set new profile picture URL
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl }
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { profilePictureUrl }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    
    // Delete uploaded file if update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
});

module.exports = router;
