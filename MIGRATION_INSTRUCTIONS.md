# Database Migration Instructions

## Status
✅ Migration files are **READY** and schema is **PREPARED**  
⏳ Migration execution requires **MANUAL CONFIRMATION** or database accessibility

---

## What Has Been Done

1. ✅ Prisma schema fully extended with all new fields
2. ✅ Schema validated and formatted successfully
3. ✅ Slug field made optional with default UUID to handle existing data
4. ✅ All new models, enums, and relationships defined

---

## Migration Command Ready to Execute

The following command is ready and waiting for confirmation:

```bash
cd server
npx prisma migrate dev --name add_course_management_enhancements
```

When you run this command, Prisma will ask:
```
? Are you sure you want to create and apply this migration? » (y/N)
```

**Answer: `y` (yes)**

---

## What the Migration Will Do

### Tables to be Modified

#### `courses` table
- Add `subtitle` (VARCHAR(120), nullable)
- Add `slug` (TEXT, unique, nullable with UUID default)
- Add `thumbnail_alt_text` (TEXT, nullable)
- Add `intro_video_url` (TEXT, nullable)
- Add `meta_description` (VARCHAR(160), nullable)
- Add `learning_outcomes` (JSONB, default '[]')
- Add `target_audience` (TEXT, nullable)
- Add `tags` (JSONB, default '[]')
- Add `change_log` (JSONB, default '[]')
- Add index on `slug`

#### `lessons` table
- Add `content_type` (ENUM, default 'MIXED')
- Add `transcript_url` (TEXT, nullable)
- Add `captions_enabled` (BOOLEAN, default false)
- Add `key_terms` (JSONB, default '[]')
- Add `example_problem` (TEXT, nullable)
- Add `practice_task` (TEXT, nullable)
- Add `alt_text_provided` (BOOLEAN, default false)
- Add `auto_complete_threshold` (INTEGER, default 90)
- Add `word_count` (INTEGER, nullable)

#### `quizzes` table
- Add `points_on_pass` (INTEGER, default 50)
- Add `badge_eligible` (BOOLEAN, default false)

#### `questions` table
- Add `cognitive_level` (ENUM, default 'RECALL')
- Add `tags` (JSONB, default '[]')
- Add `usage_count` (INTEGER, default 0)
- Add `case_sensitive` (BOOLEAN, default false)
- Add `acceptable_range` (FLOAT, nullable)
- Add `acceptable_alternatives` (JSONB, default '[]')
- Add `is_in_question_bank` (BOOLEAN, default false)
- Add index on `is_in_question_bank`

### Tables to be Created

#### `course_versions` table
- `id` (UUID, primary key)
- `course_id` (UUID, foreign key)
- `version_number` (INTEGER)
- `changes_summary` (TEXT)
- `snapshot_data` (JSONB)
- `published_at` (TIMESTAMP)
- Indexes on `course_id` and `published_at`

#### `lesson_templates` table
- `id` (UUID, primary key)
- `name` (TEXT)
- `description` (TEXT)
- `structure` (JSONB)
- `is_public` (BOOLEAN, default false)
- `created_by` (UUID, foreign key to users)
- `usage_count` (INTEGER, default 0)
- `created_at`, `updated_at` (TIMESTAMP)
- Indexes on `created_by` and `is_public`

#### `content_snippets` table
- `id` (UUID, primary key)
- `name` (TEXT)
- `type` (ENUM: SnippetType)
- `template` (TEXT)
- `is_public` (BOOLEAN, default false)
- `created_by` (UUID, foreign key to users)
- `usage_count` (INTEGER, default 0)
- `created_at`, `updated_at` (TIMESTAMP)
- Indexes on `created_by`, `type`, and `is_public`

### New Enums to be Created

- `ContentType`: VIDEO, TEXT, MIXED
- `CognitiveLevel`: RECALL, APPLICATION, ANALYSIS
- `SnippetType`: DEFINITION, FORMULA, TIP, WARNING, EXAMPLE, SUMMARY
- `QuestionType`: Added NUMERIC to existing values

### Relations to be Added

- User → LessonTemplate (one-to-many)
- User → ContentSnippet (one-to-many)
- Course → CourseVersion (one-to-many)

---

## Post-Migration Steps

After migration completes successfully:

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Update Existing Course Slugs (Optional but Recommended)

Create a script to populate slugs for existing courses:

```javascript
// server/scripts/populate-slugs.js
const { PrismaClient } = require('@prisma/client');
const { generateUniqueCourseSlug } = require('../src/utils/slugGenerator');

const prisma = new PrismaClient();

async function populateSlugs() {
  const courses = await prisma.course.findMany({
    where: { slug: null },
    select: { id: true, title: true, tutorId: true }
  });

  console.log(`Found ${courses.length} courses without slugs`);

  for (const course of courses) {
    const slug = await generateUniqueCourseSlug(course.title, course.tutorId, course.id);
    await prisma.course.update({
      where: { id: course.id },
      data: { slug }
    });
    console.log(`Updated course ${course.id} with slug: ${slug}`);
  }

  console.log('Slug population complete!');
}

populateSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
node server/scripts/populate-slugs.js
```

### 3. Make Slug Required (Optional - for data integrity)

After all existing courses have slugs, you can make the field required:

Edit `schema.prisma`:
```prisma
slug String @unique  // Remove the ? to make it required
```

Then create another migration:
```bash
npx prisma migrate dev --name make_slug_required
```

### 4. Restart Development Server
```bash
cd server
npm run dev
```

---

## Troubleshooting

### If migration fails due to duplicate slugs:

1. Check for duplicates:
```sql
SELECT slug, COUNT(*) 
FROM courses 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1;
```

2. Manually fix duplicates before re-running migration

### If you need to rollback:

```bash
npx prisma migrate reset  # ⚠️ CAUTION: Deletes all data
```

Or manually:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

### If Prisma client is out of sync:

```bash
npx prisma generate --force
```

---

## Alternative: Manual Migration for Production

If you prefer manual control, create the migration file without applying:

```bash
npx prisma migrate dev --create-only --name add_course_management_enhancements
```

Then edit the generated SQL file in `prisma/migrations/` and apply manually.

---

## Verification After Migration

### Check schema applied correctly:
```bash
npx prisma db pull
```

### Verify in database:
```bash
npx prisma studio
```

### Test course creation:
```bash
# Use the CourseEditor UI to create a test course
# Verify all new fields are saved correctly
```

---

## Expected Outcome

✅ All new fields available in database  
✅ Existing courses retain their data  
✅ New courses can use enhanced features  
✅ Prisma client updated with new types  
✅ Application runs without errors  

---

## Migration Timeline

**Estimated Duration**: 2-5 minutes
- Schema changes: ~1 minute
- Index creation: ~30 seconds
- Prisma client generation: ~30 seconds
- Verification: ~1 minute

---

## Notes

- The `slug` field is currently **optional** to allow existing data to migrate safely
- After populating slugs for existing courses, you can make it required
- All JSON fields have empty array defaults to prevent null issues
- The migration is **backwards compatible** - existing functionality will continue to work
- No data will be lost - only new columns are added

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Review the generated SQL in `prisma/migrations/`
3. Verify database connectivity
4. Check for conflicting migrations
5. Consult Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

**Status**: ✅ Ready for execution  
**Last Updated**: December 7, 2025  
**Phase**: 1 - Schema Extensions Complete
