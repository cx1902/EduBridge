const prisma = require('./prisma');

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to slug
 * @returns {string} - URL-friendly slug
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate a unique slug for a course
 * @param {string} title - Course title
 * @param {string} tutorId - Tutor ID
 * @param {string} existingCourseId - Optional: ID of course being updated (to exclude from uniqueness check)
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueCourseSlug(title, tutorId, existingCourseId = null) {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (true) {
    const existingCourse = await prisma.course.findFirst({
      where: {
        slug,
        id: existingCourseId ? { not: existingCourseId } : undefined,
      },
    });

    if (!existingCourse) {
      return slug;
    }

    // If slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} - True if valid
 */
function isValidSlug(slug) {
  // Slug should be lowercase, alphanumeric with hyphens, no spaces
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 200;
}

/**
 * Check if a slug is available
 * @param {string} slug - Slug to check
 * @param {string} excludeCourseId - Optional: Course ID to exclude from check
 * @returns {Promise<boolean>} - True if available
 */
async function isSlugAvailable(slug, excludeCourseId = null) {
  const existingCourse = await prisma.course.findFirst({
    where: {
      slug,
      id: excludeCourseId ? { not: excludeCourseId } : undefined,
    },
  });

  return !existingCourse;
}

module.exports = {
  generateSlug,
  generateUniqueCourseSlug,
  isValidSlug,
  isSlugAvailable,
};
