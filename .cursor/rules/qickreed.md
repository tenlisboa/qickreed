# QickReed Cursor Rules

## Project Overview

QickReed is a Next.js 15 application built with React 19, TypeScript, Tailwind CSS v4, DaisyUI, and Supabase for authentication. This document outlines the development guidelines, UI/UX standards, and code patterns for the project.

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, DaisyUI
- **Authentication**: Supabase
- **Linting/Formatting**: Biome
- **Package Manager**: pnpm

### Directory Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── (authenticated)/  # Protected routes
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── profile/
│   │   └── settings/
│   └── error/
├── components/           # Reusable components
└── utils/               # Utility functions
    └── supabase/        # Supabase client configurations
```

## UI/UX Design Guidelines

### Design Philosophy

QickReed follows a **minimalist, monochromatic design** approach with these core principles:

1. **Minimalism First**: Clean, uncluttered interfaces focused on functionality
2. **Monochromatic Elegance**: Black, white, and gray color palette for timeless appeal
3. **User-Centered Design**: Every element serves a clear purpose
4. **Accessibility**: Inclusive design that works for all users
5. **Consistency**: Uniform patterns across all interfaces

### Color Palette

```css
/* Primary Colors */
--primary-white: #ffffff     /* Backgrounds, cards */
--primary-black: #000000     /* Text, buttons, borders */
--dark-gray: #171717         /* Dark theme text */
--medium-gray: #6b7280       /* Secondary text */
--light-gray: #d1d5db        /* Borders, dividers */
--background-gray: #f9fafb   /* Alternative backgrounds */
```

### Typography

**Font Stack**: Geist Sans (primary), system fonts fallback

```css
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
```

**Text Hierarchy**:

- **H1**: `text-3xl font-bold` (30px, 700 weight, black)
- **H2**: `text-2xl font-semibold` (24px, 600 weight, black)
- **H3**: `text-xl font-medium` (20px, 500 weight, dark gray)
- **Body**: `text-base` (16px, 400 weight, black)
- **Secondary**: `text-gray-600` (16px, 400 weight, medium gray)
- **Small**: `text-sm` (14px, 400 weight, medium gray)
- **Extra Small**: `text-xs` (12px, 400 weight, light gray)

### Component Standards

#### Cards

```tsx
<div className="card bg-white border border-gray-200 shadow-lg">
  <div className="card-body p-8">{/* Content */}</div>
</div>
```

#### Form Elements

**Input Fields**:

```tsx
<input
  className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
  placeholder="Enter your email"
/>
```

**Labels**:

```tsx
<label className="label" htmlFor="email">
  <span className="label-text text-black font-medium">Email</span>
</label>
```

**Primary Button**:

```tsx
<button className="btn btn-block bg-black hover:bg-gray-800 text-white border-none transition-colors">
  Sign In
</button>
```

**Secondary Button (Links)**:

```tsx
<Link href="/signup" className="text-black font-medium hover:underline">
  Sign up
</Link>
```

#### Layout Components

**Page Container**:

```tsx
<div className="min-h-screen bg-white flex items-center justify-center px-4">
  <div className="w-full max-w-md">{/* Content */}</div>
</div>
```

**Brand Section**:

```tsx
<div className="text-center mb-8">
  <h1 className="text-3xl font-bold text-black">QickReed</h1>
  <p className="text-gray-600 mt-2">Sign in to your account</p>
</div>
```

### Spacing System

Use Tailwind's spacing scale consistently:

- **Form fields**: `space-y-6` (1.5rem vertical spacing)
- **Card padding**: `p-8` (2rem)
- **Section margins**: `mb-8`, `mt-8` (2rem)
- **Element spacing**: `mt-2` (0.5rem)

### Interactive States

**Focus States**:

```css
.focus\:border-black:focus {
  border-color: #000000;
  outline: none;
}
```

**Hover States**:

```css
.hover\:bg-gray-800:hover {
  background-color: #1f2937;
}
.hover\:underline:hover {
  text-decoration: underline;
}
```

**Transitions**:

```css
.transition-colors {
  transition: color 150ms ease-in-out, background-color 150ms ease-in-out;
}
```

### Accessibility Guidelines

1. **Form Accessibility**: Every form field must have an associated label using `htmlFor`
2. **Required Fields**: Use the `required` attribute for mandatory fields
3. **Focus Indicators**: All interactive elements must have visible focus states
4. **Color Contrast**: All text must meet WCAG AA contrast requirements
5. **Keyboard Navigation**: Logical tab order through interactive elements

## TypeScript & React Patterns

### TypeScript Configuration

- **Strict Mode**: Always use `strict: true`
- **Path Mapping**: Use `@/*` for src imports
- **Type Safety**: Prefer explicit typing over `any`

### Component Patterns

#### Server Components (Default)

```tsx
// Default export - Server Component
export default function PageComponent() {
  return <div>Server Component</div>;
}
```

#### Client Components

```tsx
"use client";

import { useState } from "react";

export default function ClientComponent() {
  const [state, setState] = useState(false);
  return <div>Client Component</div>;
}
```

#### Server Actions

```tsx
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
```

### Interface Definitions

```tsx
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}
```

### Next.js Hooks Usage

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

export default function NavigationComponent() {
  const pathname = usePathname();
  const router = useRouter();

  // Component logic
}
```

## Next.js App Router Patterns

### Route Organization

- **Route Groups**: Use `(auth)` and `(authenticated)` for logical grouping
- **Nested Layouts**: Use `layout.tsx` for shared layouts
- **Loading States**: Create `loading.tsx` files for loading UI
- **Error Handling**: Use `error.tsx` for error boundaries

### File Naming Conventions

- **Pages**: `page.tsx` (route pages)
- **Layouts**: `layout.tsx` (shared layouts)
- **Loading**: `loading.tsx` (loading UI)
- **Errors**: `error.tsx` (error boundaries)
- **Actions**: `actions.ts` (Server Actions)
- **API Routes**: `route.ts` (API endpoints)

### Metadata and SEO

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QickReed - Sign In",
  description: "Sign in to your QickReed account",
};
```

## Supabase Authentication Patterns

### Client Creation

**Server Client**:

```tsx
// src/utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context - can be ignored with middleware
          }
        },
      },
    }
  );
}
```

**Client Component**:

```tsx
// src/utils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

### Authentication Flow

1. **Login**: Use Server Actions for authentication
2. **Session Management**: Handle via middleware
3. **Route Protection**: Implement in layout components
4. **Logout**: Server Action with redirect

### Middleware Configuration

```tsx
// src/middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## Tailwind CSS & DaisyUI Standards

### DaisyUI Components Used

- `card`, `card-body`: Container components
- `input`, `input-bordered`: Form inputs
- `btn`, `btn-block`: Buttons
- `form-control`, `label`, `label-text`: Form structure
- `divider`: Visual separators

### Tailwind Class Patterns

**Layout**:

```tsx
className = "min-h-screen bg-white flex items-center justify-center px-4";
```

**Typography**:

```tsx
className = "text-3xl font-bold text-black";
className = "text-gray-600 mt-2";
```

**Interactive Elements**:

```tsx
className =
  "btn btn-block bg-black hover:bg-gray-800 text-white border-none transition-colors";
```

**Form Elements**:

```tsx
className =
  "input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0";
```

### Responsive Design

- **Mobile First**: Start with mobile styles
- **Breakpoints**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`)
- **Container**: Max width `max-w-md` for forms, `max-w-4xl` for content

## Code Formatting & Linting

### Biome Configuration

The project uses Biome for formatting and linting with these settings:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  }
}
```

### Import Organization

```tsx
// 1. React imports
import { useState } from "react";

// 2. Next.js imports
import Link from "next/link";
import { usePathname } from "next/navigation";

// 3. Third-party imports
import { createClient } from "@supabase/supabase-js";

// 4. Local imports
import { login } from "./actions";
```

## File Naming Conventions

### Components

- **PascalCase**: `Sidebar.tsx`, `UserProfile.tsx`
- **Default exports**: Use default export for main component
- **Props interfaces**: Define in same file or separate types file

### Pages and Routes

- **kebab-case**: `user-profile/page.tsx`, `forgot-password/page.tsx`
- **Special files**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Utilities

- **camelCase**: `authUtils.ts`, `dateHelpers.ts`
- **kebab-case**: `supabase-client.ts`, `api-helpers.ts`

## Development Workflow

### Before Starting Development

1. **Read UI Guidelines**: Review `/docs/ui-guidelines.md`
2. **Check Existing Patterns**: Look at similar components/pages
3. **Follow TypeScript**: Use strict typing
4. **Test Responsiveness**: Mobile-first approach

### Code Review Checklist

- [ ] Follows UI/UX guidelines
- [ ] Proper TypeScript typing
- [ ] Accessibility considerations
- [ ] Responsive design
- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] Security considerations (auth, validation)

### Common Patterns

#### Form Handling

```tsx
<form className="space-y-6">
  <div className="form-control">
    <label className="label" htmlFor="email">
      <span className="label-text text-black font-medium">Email</span>
    </label>
    <input
      id="email"
      name="email"
      type="email"
      required
      className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
    />
  </div>
</form>
```

#### Navigation Components

```tsx
<Link
  href={item.href}
  className={`
    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
    ${
      isActive
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-black"
    }
  `}
>
  <span className="text-base flex-shrink-0">{item.icon}</span>
  <span className="ml-3 truncate">{item.name}</span>
</Link>
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Future Considerations

### Dark Mode Support

The foundation is prepared for dark mode implementation:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### Component Library Expansion

As the application grows, consider creating:

- Navigation components
- Dashboard cards
- Data tables
- Modal dialogs
- Loading states
- Error states

All future components should adhere to the established design principles and color palette outlined in this document.

---

_This document serves as the foundation for all development in QickReed. Any deviations from these guidelines should be documented and approved by the development team._
