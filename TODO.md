## 2. Admin Quiz Creation Interface
**Current Issue**: Admin cannot create/edit quizzes for texts. TextForm has TODO comment at line 174. Assessment requires `quiz_json` to exist (quiz page shows error if missing).

**Detailed Scope**:
- **Files to modify**:
  - `/src/app/(authenticated)/admin/texts/components/TextForm.tsx` - Add quiz creation UI
  - `/src/app/(authenticated)/admin/texts/schemas.ts` - Add quiz validation schema
  - `/src/app/(authenticated)/admin/texts/actions.ts` - Update create/update to handle quiz data
  - `/src/components/QuizQuestion.tsx` - Reuse for admin quiz preview/editing
- **Quiz UI requirements**:
  - Dynamic question add/remove (minimum 1, maximum 10 questions)
  - Each question needs: question text, 4-5 options, correct answer selection
  - Question type selector (What, Who, When, Where, Why - per MVP_SCOPE.md)
  - Preview mode to test quiz before saving
  - Validation: all fields required, at least 2 options per question
  - Drag-and-drop reordering for questions (optional enhancement)
  - Real-time word count for question text
  - Mark correct answer with visual indicator (e.g., checkmark icon)
- **Quiz data structure** (per types/database.ts):
  ```typescript
  interface QuizQuestion {
    id: string;
    type: 'what' | 'who' | 'when' | 'where' | 'why';
    question: string;
    options: string[]; // 4-5 options
    correct_answer: number; // index of correct option
  }
  ```
- **Database integration**:
  - quiz_json field already exists in Text table
  - QuizData interface already defined in types/database.ts
  - Need to ensure proper JSON serialization
  - Validate quiz structure before saving to prevent assessment errors
- **Form validation schema**:
  - Minimum 1 question, maximum 10 questions
  - Each question: text required (max 500 chars), 4-5 options required
  - Exactly one correct answer per question
  - Options must be unique within a question
  - Question text must be in Portuguese (or match text language)
- **UX considerations**:
  - Collapsible quiz section in TextForm to avoid overwhelming UI
  - "Add Question" button with clear visual feedback
  - Preview button opens modal with quiz as it would appear to users
  - Save quiz as draft (optional) - allow saving text without quiz
  - Warning when deleting questions that have content
- **Success criteria**: Admin can create complete texts with quizzes, assessment flow works end-to-end, quiz validation prevents invalid data

---

## 3. Page Loading/Flash Optimization
**Current Issue**: Visual flashing/blinking when navigating between pages due to client-side data fetching patterns.

**Detailed Scope**:
- **Root causes identified**:
  - Client components with useEffect fetching data cause layout shifts
  - Loading states not properly implemented across authenticated routes
  - Missing Suspense boundaries for async operations
  - Potential hydration mismatches
  - Missing loading.tsx files for route segments
- **Files to audit and optimize**:
  - `/src/app/(authenticated)/layout.tsx` - Add loading skeleton
  - `/src/app/(authenticated)/dashboard/page.tsx` - Convert to server component where possible
  - `/src/app/(authenticated)/admin/texts/page.tsx` - Add proper loading states
  - `/src/app/(authenticated)/assessment/reading/page.tsx` - Already has Suspense, verify effectiveness
  - `/src/app/(authenticated)/assessment/quiz/page.tsx` - Check for loading states
  - `/src/app/(authenticated)/training/rsvp/page.tsx` - Optimize RSVP loading
- **Implementation approach**:
  - Add loading.tsx files for route segments with loading states:
    - `/src/app/(authenticated)/loading.tsx` - Global authenticated layout loader
    - `/src/app/(authenticated)/dashboard/loading.tsx` - Dashboard skeleton
    - `/src/app/(authenticated)/admin/texts/loading.tsx` - Admin texts table skeleton
  - Implement skeleton screens for data-heavy pages:
    - Card skeleton with shimmer effect
    - Table skeleton with row placeholders
    - Chart skeleton for dashboard metrics
  - Use Suspense boundaries for async data fetching:
    - Wrap async components in <Suspense fallback={...}>
    - Use React's use() hook for promises in Server Components
  - Convert client-side data fetching to Server Components:
    - Move data fetching from useEffect to Server Components
    - Use Server Actions for mutations
    - Pass data as props to client components
  - Add CSS transitions for smoother state changes:
    - Use Tailwind's transition utilities
    - Add fade-in animations for content loading
  - Implement proper error boundaries:
    - Add error.tsx files for route segments
    - Graceful fallback for failed data fetches
- **Next.js 15 specific optimizations**:
  - Use `use()` hook for async params and searchParams
  - Leverage native fetch caching with revalidate options
  - Use `dynamic = 'force-dynamic'` only when necessary
  - Implement streaming for large data sets
- **Performance monitoring**:
  - Add Core Web Vitals monitoring
  - Track LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift)
  - Use Next.js built-in analytics or external tools
- **Success criteria**: No visible layout shifts or flashing during page transitions, LCP < 2.5s, CLS < 0.1

---

[ ] - Implement internationalization (i18n)
