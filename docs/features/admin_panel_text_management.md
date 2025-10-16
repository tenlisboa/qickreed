# Admin Panel for Text Management

## Overview

The admin panel is a section accessible through the `/admin` route, where users with admin role can manage the following resources:

- **Texts**: Creation, editing, viewing and deletion of texts for assessments

## Admin role creation

The column `role` in the `auth.users` table should created through a migration file.

```sh
pnpm supabase migration new create_admin_role
```

```sql
-- Create role enum
CREATE TYPE user_role AS ENUM ('member', 'admin');

ALTER TABLE auth.users ADD COLUMN "role" user_role NOT NULL DEFAULT 'member'::user_role;
```

## Text Management

The text management section is located at the `/admin/texts` route and allows administrators to:

- Create new texts
- Edit existing texts
- Delete texts
- View all texts

### Create New Text

**Features:**

- Form based on the `text` table fields (reference: [migration](../../supabase/migrations/20251015014135_create_initial_tables.sql))
- Rich text editor for content
- Form validation with standard React library
- Required fields: title, content, type, language

**Form Fields:**

- `title` (VARCHAR 255) - Text title
- `content` (TEXT) - Text content (rich text editor)
- `type` (ENUM) - Type: 'diagnostic' or 'training'
- `num_words` (INTEGER) - Number of words (calculated automatically)
- `language` (VARCHAR 10) - Language (default: 'pt-BR')
- `quiz_json` (JSONB) - Quiz data (optional)

### Edit Text

**Features:**

- Pre-filled form with existing data
- Rich text editor for content editing
- Form validation
- Real-time word count update

### Delete Text

**Business Rules:**

- **Restriction**: Texts linked to assessment sessions cannot be deleted
- **Alert**: Display error message when deletion attempt is blocked
- **Confirmation**: Confirmation modal for texts that can be deleted

**Deletion Validation:**

```sql
-- Check if text is being used in sessions
SELECT COUNT(*) FROM diagnostic_session WHERE text_id = ?
SELECT COUNT(*) FROM training_session WHERE text_id = ?
```

### View Texts

**Table Features:**

- **Search**: Filter by text title
- **Sorting**: By title, creation date, word count, type
- **Pagination**: Navigation between result pages
- **Actions**: Edit and delete buttons for each text

**Table Columns:**
| Field | Type | Description |
|-------|------|-------------|
| Title | String | Text title |
| Type | Enum | Diagnostic or Training |
| Words | Number | Word count |
| Language | String | Language code |
| Created At | Date | Creation date |
| Actions | Actions | Edit/Delete |

## Technical Implementation

### Recommended Libraries

**Rich Text Editor:**

- [React Quill](https://github.com/zenoamaro/react-quill) - React wrapper for Quill

**Form Validation:**

- [React Hook Form](https://react-hook-form.com/) - Optimized performance

**UI Components:**

- [DaisyUI](https://daisyui.com/) - Tailwind CSS components

### Route Structure

```
/admin
├── /texts
│   ├── /create          # Create new text
│   ├── /edit/[id]       # Edit specific text
│   └── /                # Text list
```

### Permissions

- **Access**: Only users with `role = 'admin'`
- **Middleware**: Permission verification on all `/admin/*` routes
- **RLS**: Security policies at database level
