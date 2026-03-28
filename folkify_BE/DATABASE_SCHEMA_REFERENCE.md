# Database Schema Quick Reference

## Tables Overview

| Table               | Purpose              | Key Fields                                         |
| ------------------- | -------------------- | -------------------------------------------------- |
| User                | User accounts        | email, password_hash, account_type, role           |
| UserStats           | User statistics      | level, total_xp, lessons_completed, streaks        |
| Instrument          | Folk instruments     | name, english_name, category, region               |
| Lesson              | Learning content     | title, level, is_premium, duration                 |
| UserProgress        | Lesson tracking      | user_id, lesson_id, completed, progress_percentage |
| SheetMusic          | Sheet music library  | title, composer, level, is_premium                 |
| UserPurchase        | Sheet purchases      | user_id, sheet_music_id, purchased_at              |
| PremiumSubscription | Subscription records | user_id, plan_type, status, expires_at             |
| PaymentTransaction  | Payment history      | user_id, amount, status, payment_method            |
| AIGradingSession    | AI grading records   | user_id, lesson_id, ai_score, status               |
| PracticeSession     | Practice tracking    | user_id, lesson_id, duration_minutes, xp_earned    |
| AdminActivityLog    | Admin audit log      | admin_id, action, resource_type, changes           |

## Account Types

```typescript
enum AccountType {
  free    // Free tier - limited access
  basic   // Basic premium - more content
  pro     // Pro premium - unlimited AI grading
}
```

**Access Rules:**

- FREE: Free lessons and sheet music only
- BASIC: All lessons and sheet music, limited AI grading
- PRO: Everything + unlimited AI grading

## User Roles

```typescript
enum UserRole {
  user   // Regular user
  admin  // Administrator with full access
}
```

## Lesson Levels

```typescript
enum LessonLevel {
  Beginner      // Entry level
  Intermediate  // Medium difficulty
  Advanced      // Expert level
}
```

## Key Relationships

### User Relationships

```
User (1) ←→ (1) UserStats
User (1) ←→ (N) UserProgress
User (1) ←→ (N) PremiumSubscription
User (1) ←→ (N) PaymentTransaction
User (1) ←→ (N) AIGradingSession
User (1) ←→ (N) PracticeSession
User (1) ←→ (N) UserPurchase
```

### Instrument Relationships

```
Instrument (1) ←→ (N) Lesson
Instrument (1) ←→ (N) SheetMusic
Instrument (1) ←→ (N) PracticeSession
```

### Lesson Relationships

```
Lesson (1) ←→ (N) UserProgress
Lesson (1) ←→ (N) AIGradingSession
Lesson (1) ←→ (N) PracticeSession
```

### SheetMusic Relationships

```
SheetMusic (1) ←→ (N) UserPurchase
```

## Important Indexes

### Performance Indexes

- `User.email` - Fast login lookup
- `User.account_type` - Filter by account type
- `User.premium_expires_at` - Expiration checks
- `Lesson.instrument_id` - Get lessons by instrument
- `UserProgress.user_id` - Get user's progress
- `PaymentTransaction.created_at` - Revenue reports

### Unique Constraints

- `User.email` - One account per email
- `UserStats.user_id` - One stats record per user
- `UserProgress(user_id, lesson_id)` - One progress per user per lesson
- `UserPurchase(user_id, sheet_music_id)` - One purchase per user per sheet

## Common Queries

### Check if user has premium access

```typescript
const isPremium = user.account_type !== 'free' && user.premium_expires_at > new Date();
```

### Check if user is PRO

```typescript
const isPro = user.account_type === 'pro' && user.premium_expires_at > new Date();
```

### Get user's completed lessons

```typescript
const completed = await prisma.userProgress.findMany({
  where: {
    user_id: userId,
    completed: true,
  },
  include: { lesson: true },
});
```

### Get lessons for an instrument

```typescript
const lessons = await prisma.lesson.findMany({
  where: {
    instrument_id: instrumentId,
    status: 'published',
  },
  orderBy: { order_index: 'asc' },
});
```

### Get active premium subscriptions

```typescript
const active = await prisma.premiumSubscription.findMany({
  where: {
    status: 'active',
    expires_at: { gt: new Date() },
  },
});
```

## JSON Fields

### Instrument.facts

```json
["Fact 1", "Fact 2", "Fact 3"]
```

### Lesson.steps

```json
[
  { "title": "Step 1", "duration": 5 },
  { "title": "Step 2", "duration": 10 }
]
```

### Lesson.tips

```json
["Tip 1", "Tip 2", "Tip 3"]
```

### AIGradingSession.criteria_scores

```json
{
  "rhythm": 85,
  "pitch": 90,
  "technique": 80,
  "expression": 88
}
```

### AIGradingSession.improvement_suggestions

```json
["Suggestion 1", "Suggestion 2"]
```

### PaymentTransaction.metadata

```json
{
  "admin_note": "Manual upgrade",
  "reason": "Customer request"
}
```

### AdminActivityLog.changes

```json
{
  "field": "account_type",
  "old_value": "free",
  "new_value": "pro"
}
```

## Cascade Delete Rules

### User Deletion

When a user is deleted, these are automatically deleted:

- UserStats (CASCADE)
- UserProgress (CASCADE)
- PremiumSubscription (CASCADE)
- PaymentTransaction (CASCADE)
- AIGradingSession (CASCADE)
- PracticeSession (CASCADE)
- UserPurchase (CASCADE)

### Instrument Deletion

When an instrument is deleted:

- All its Lessons (CASCADE)
- All its SheetMusic (CASCADE)
- PracticeSession references set to NULL (SET NULL)

### Lesson Deletion

When a lesson is deleted:

- All UserProgress records (CASCADE)
- AIGradingSession references set to NULL (SET NULL)
- PracticeSession references set to NULL (SET NULL)

### SheetMusic Deletion

When sheet music is deleted:

- All UserPurchase records (CASCADE)

## Default Values

| Field                            | Default Value |
| -------------------------------- | ------------- |
| User.role                        | 'user'        |
| User.account_type                | 'free'        |
| User.account_status              | 'active'      |
| UserStats.level                  | 1             |
| UserStats.total_xp               | 0             |
| UserStats.lessons_completed      | 0             |
| UserStats.total_practice_minutes | 0             |
| UserStats.current_streak         | 0             |
| UserStats.longest_streak         | 0             |
| Instrument.popularity            | 0             |
| Instrument.order_index           | 0             |
| Lesson.status                    | 'draft'       |
| Lesson.is_premium                | false         |
| Lesson.xp                        | 100           |
| Lesson.order_index               | 0             |
| UserProgress.completed           | false         |
| UserProgress.progress_percentage | 0             |
| SheetMusic.is_premium            | false         |
| SheetMusic.pages                 | 1             |
| PremiumSubscription.status       | 'active'      |
| PaymentTransaction.currency      | 'VND'         |
| PaymentTransaction.status        | 'pending'     |
| AIGradingSession.status          | 'pending'     |
| PracticeSession.status           | 'active'      |

## Timestamps

All tables have automatic timestamps:

- `created_at` - Set on creation (default: now())
- `updated_at` - Updated on every change (auto-managed)
- `deleted_at` - Soft delete timestamp (nullable)

## Data Types

### UUID Fields

All `id` fields use UUID v4 (auto-generated)

### Decimal Fields

- `PaymentTransaction.amount` - Decimal(10, 2) for currency

### DateTime Fields

- All timestamps use DateTime type
- Stored in UTC
- Nullable fields: `?` suffix

### JSON Fields

- Stored as JSONB in PostgreSQL
- Type-safe with Prisma
- Can be queried and indexed

## Sample Data Counts

After seeding:

- 1 Admin user
- 5 Instruments
- 40 Lessons (8 per instrument)
- 20 Sheet Music items (4 per instrument)
- 0 Users (except admin)
- 0 Progress records
- 0 Transactions
- 0 Sessions

## Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Useful Prisma Studio URL

After running `npx prisma studio`, access at:

```
http://localhost:5555
```

Browse all tables, view data, and make manual edits through the UI.
