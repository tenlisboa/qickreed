# QickReed UI Design Guidelines

## Overview

This document outlines the UI design system for QickReed, establishing a consistent, minimalist design language that prioritizes clarity, accessibility, and user experience. The design philosophy centers around simplicity, using a monochromatic color palette and clean typography.

## Design Philosophy

### Core Principles

1. **Minimalism First**: Clean, uncluttered interfaces that focus on functionality
2. **Monochromatic Elegance**: Black, white, and gray color palette for timeless appeal
3. **User-Centered Design**: Every element serves a clear purpose
4. **Accessibility**: Inclusive design that works for all users
5. **Consistency**: Uniform patterns across all interfaces

## Color Palette

### Primary Colors

```css
--primary-white: #ffffff     /* Backgrounds, cards */
--primary-black: #000000     /* Text, buttons, borders */
--dark-gray: #171717         /* Dark theme text */
--medium-gray: #6b7280       /* Secondary text */
--light-gray: #d1d5db        /* Borders, dividers */
--background-gray: #f9fafb   /* Alternative backgrounds */
```

### Usage Guidelines

- **White (#ffffff)**: Primary backgrounds, card backgrounds, input fields
- **Black (#000000)**: Primary text, button backgrounds, focus states
- **Dark Gray (#171717)**: Secondary headings, important text
- **Medium Gray (#6b7280)**: Helper text, labels, secondary information
- **Light Gray (#d1d5db)**: Borders, dividers, disabled states

## Typography

### Font Stack

```css
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
```

### Text Hierarchy

#### Headings

```css
/* H1 - Page Titles */
.text-3xl.font-bold {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  color: #000000;
  line-height: 1.2;
}

/* H2 - Section Titles */
.text-2xl.font-semibold {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  color: #000000;
  line-height: 1.3;
}

/* H3 - Subsection Titles */
.text-xl.font-medium {
  font-size: 1.25rem; /* 20px */
  font-weight: 500;
  color: #171717;
  line-height: 1.4;
}
```

#### Body Text

```css
/* Primary Text */
.text-base {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  color: #000000;
  line-height: 1.5;
}

/* Secondary Text */
.text-gray-600 {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  color: #6b7280;
  line-height: 1.5;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  color: #6b7280;
  line-height: 1.4;
}

/* Extra Small Text */
.text-xs {
  font-size: 0.75rem; /* 12px */
  font-weight: 400;
  color: #9ca3af;
  line-height: 1.3;
}
```

## Components

### Cards

Cards are the primary container component for grouping related content.

```tsx
<div className="card bg-white border border-gray-200 shadow-lg">
  <div className="card-body p-8">{/* Content */}</div>
</div>
```

**Specifications:**

- Background: White (`bg-white`)
- Border: Light gray (`border-gray-200`)
- Shadow: Large shadow (`shadow-lg`)
- Padding: 2rem (`p-8`)

### Form Elements

#### Input Fields

```tsx
<input
  className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
  placeholder="Enter your email"
/>
```

**Specifications:**

- Background: White (`bg-white`)
- Border: Light gray (`border-gray-300`)
- Text: Black (`text-black`)
- Placeholder: Medium gray (`placeholder-gray-400`)
- Focus: Black border (`focus:border-black`)
- Width: Full width (`w-full`)

#### Labels

```tsx
<label className="label" htmlFor="email">
  <span className="label-text text-black font-medium">Email</span>
</label>
```

**Specifications:**

- Text: Black (`text-black`)
- Weight: Medium (`font-medium`)
- Association: Always use `htmlFor` attribute

#### Buttons

##### Primary Button

```tsx
<button className="btn btn-block bg-black hover:bg-gray-800 text-white border-none transition-colors">
  Sign In
</button>
```

**Specifications:**

- Background: Black (`bg-black`)
- Hover: Dark gray (`hover:bg-gray-800`)
- Text: White (`text-white`)
- Width: Full width (`btn-block`)
- Border: None (`border-none`)
- Transition: Smooth color transition (`transition-colors`)

##### Secondary Button (Links)

```tsx
<Link href="/signup" className="text-black font-medium hover:underline">
  Sign up
</Link>
```

**Specifications:**

- Text: Black (`text-black`)
- Weight: Medium (`font-medium`)
- Hover: Underline (`hover:underline`)

### Layout Components

#### Page Container

```tsx
<div className="min-h-screen bg-white flex items-center justify-center px-4">
  <div className="w-full max-w-md">{/* Content */}</div>
</div>
```

**Specifications:**

- Height: Full viewport (`min-h-screen`)
- Background: White (`bg-white`)
- Layout: Centered flex container
- Padding: Horizontal padding (`px-4`)
- Max width: Medium (`max-w-md` - 448px)

#### Brand Section

```tsx
<div className="text-center mb-8">
  <h1 className="text-3xl font-bold text-black">QickReed</h1>
  <p className="text-gray-600 mt-2">Sign in to your account</p>
</div>
```

**Specifications:**

- Alignment: Centered (`text-center`)
- Margin: Bottom spacing (`mb-8`)
- Title: Large, bold, black text
- Subtitle: Gray, smaller text with top margin

## Spacing System

### Margin and Padding Scale

```css
/* Tailwind spacing scale used */
.space-y-6 > * + * {
  margin-top: 1.5rem;
} /* 24px */
.p-8 {
  padding: 2rem;
} /* 32px */
.px-4 {
  padding: 0 1rem;
} /* 16px */
.mb-8 {
  margin-bottom: 2rem;
} /* 32px */
.mt-2 {
  margin-top: 0.5rem;
} /* 8px */
.mt-8 {
  margin-top: 2rem;
} /* 32px */
```

### Form Spacing

- **Form fields**: 1.5rem vertical spacing (`space-y-6`)
- **Card padding**: 2rem (`p-8`)
- **Section margins**: 2rem (`mb-8`, `mt-8`)
- **Element spacing**: 0.5rem (`mt-2`)

## Interactive States

### Focus States

All interactive elements must have clear focus indicators:

```css
.focus\:border-black:focus {
  border-color: #000000;
  outline: none;
}
```

### Hover States

Subtle hover effects for better user feedback:

```css
.hover\:bg-gray-800:hover {
  background-color: #1f2937;
}

.hover\:underline:hover {
  text-decoration: underline;
}

.hover\:text-black:hover {
  color: #000000;
}
```

### Transition Effects

Smooth transitions for all state changes:

```css
.transition-colors {
  transition: color 150ms ease-in-out, background-color 150ms ease-in-out;
}
```

## Accessibility Guidelines

### Form Accessibility

1. **Labels**: Every form field must have an associated label using `htmlFor`
2. **Required Fields**: Use the `required` attribute for mandatory fields
3. **Placeholder Text**: Provide helpful placeholder text for guidance
4. **Error States**: Use clear error messaging and visual indicators

### Keyboard Navigation

1. **Focus Indicators**: All interactive elements must have visible focus states
2. **Tab Order**: Logical tab order through interactive elements
3. **Keyboard Shortcuts**: Support standard keyboard interactions

### Color Contrast

All text must meet WCAG AA contrast requirements:

- **Black on White**: 21:1 ratio (AAA compliance)
- **Gray (#6b7280) on White**: 4.5:1 ratio (AA compliance)

## Component Examples

### Authentication Forms

The login and signup pages serve as the reference implementation:

#### Login Page Structure

```tsx
<div className="min-h-screen bg-white flex items-center justify-center px-4">
  <div className="w-full max-w-md">
    {/* Brand Section */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-black">QickReed</h1>
      <p className="text-gray-600 mt-2">Sign in to your account</p>
    </div>

    {/* Form Card */}
    <div className="card bg-white border border-gray-200 shadow-lg">
      <div className="card-body p-8">
        <form className="space-y-6">{/* Form fields */}</form>

        <div className="divider text-gray-400">or</div>

        {/* Alternative actions */}
      </div>
    </div>

    {/* Footer */}
    <div className="text-center mt-8">
      <p className="text-xs text-gray-500">
        © 2025 QickReed. All rights reserved.
      </p>
    </div>
  </div>
</div>
```

## Implementation Notes

### DaisyUI Components Used

- `card`, `card-body`: Container components
- `input`, `input-bordered`: Form inputs
- `btn`, `btn-block`: Buttons
- `form-control`, `label`, `label-text`: Form structure
- `divider`: Visual separators
- `checkbox`: Form checkboxes

### Custom CSS Classes

The design system relies primarily on Tailwind CSS classes with minimal custom CSS. Any custom styles should follow the established color palette and spacing system.

### Responsive Design

The layout is mobile-first with responsive breakpoints:

- **Mobile**: Full width with padding (`px-4`)
- **Desktop**: Centered with max width (`max-w-md`)

## Future Considerations

### Dark Mode Support

While the current implementation focuses on light mode, the foundation is prepared for dark mode:

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

_This document serves as the foundation for all UI development in QickReed. Any deviations from these guidelines should be documented and approved by the design team._
