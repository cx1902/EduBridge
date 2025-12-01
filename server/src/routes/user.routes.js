const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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

module.exports = router;
