# TODO - QickReed Project

## 1. Login Error Handling Enhancement
**Current Issue**: Login errors in `/src/app/(auth)/login/actions.ts` blindly redirect to `/error` without context or user-friendly messages.

**Detailed Scope**:
- **Files to modify**:
  - `/src/app/(auth)/login/actions.ts` - Add error type detection and context passing
  - `/src/app/(auth)/login/page.tsx` - Add error display UI with inline error messages
  - `/src/app/error/page.tsx` - Enhance generic error page with error context
- **Specific error cases to handle**:
  - Invalid credentials (wrong email/password) - "Email ou senha inválidos"
  - Email not confirmed - "Por favor, confirme seu email antes de fazer login"
  - Network/timeout errors - "Erro de conexão. Tente novamente"
  - Rate limiting errors - "Muitas tentativas. Aguarde alguns minutos"
  - User not found - "Usuário não encontrado"
  - Generic auth errors - "Erro ao fazer login. Tente novamente"
- **Implementation approach**:
  - Use URL search params to pass error type and message (e.g., `?error=invalid_credentials`)
  - Display inline error alerts on login form instead of redirecting
  - Add specific error messages in Portuguese for each error type
  - Keep redirect only for unexpected/critical errors
  - Implement error boundary for client-side errors
  - Add loading state during authentication to prevent double submissions
  - Use Supabase error codes for precise error detection:
    - `auth/invalid_credentials` - wrong password
    - `auth/email_not_confirmed` - unconfirmed email
    - `auth/user_not_found` - no user exists
    - `auth/too_many_requests` - rate limited
- **Error handling pattern**:
  ```typescript
  // In actions.ts
  if (error) {
    const errorType = error.message.includes('Invalid login credentials') 
      ? 'invalid_credentials' 
      : error.message.includes('Email not confirmed')
      ? 'email_not_confirmed'
      : 'generic';
    redirect(`/login?error=${errorType}`);
  }
  ```
- **Success criteria**: Users see specific error messages on login page without page redirects, all error cases handled with appropriate Portuguese messages

---

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

## 4. Neobrutalism Design System Migration
**Current Issue**: Current design uses DaisyUI + custom monochromatic theme. Need to migrate to Neobrutalism design system.

**Detailed Scope**:
- **Current design stack**:
  - DaisyUI components (buttons, cards, inputs, etc.)
  - Custom Tailwind theme in globals.css (monochromatic grayscale)
  - Custom components (Button.tsx, Card.tsx)
- **Research findings - Neobrutalism design principles**:
  - **Thick black borders**: 2-4px solid borders (typically 3px)
  - **Hard offset shadows**: No blur, fixed offset (e.g., `4px 4px 0px #000`)
  - **High contrast colors**: Limited palette (3-4 colors), black for borders/shadows
  - **Bold typography**: Oversized headlines, monospace accents
  - **Square corners**: No rounded corners (radius: 0)
  - **Flat fills**: No gradients, solid color blocks
  - **Physical interactions**: Hover shifts toward shadow, active removes offset
  - **Visible structure**: Exposed box model, deliberate "unfinished" aesthetic
- **Recommended library options**:
  1. **neobrutal-ui** (Bridgetamana) - Built with Base UI + Tailwind, CLI installation
     - Install: `npx neobrutal init` then `npx neobrutal add button card input`
     - Components: Button, Card, Input, Select, Dialog, Alert, etc.
     - MIT License, active maintenance
  2. **@thedevrealm/neo-react** - Framework-agnostic, React adapter
     - Install: `npm i @thedevrealm/neo-css @thedevrealm/neo-react`
     - Rich component set with animations
  3. **BrutalizmUI** - Built on shadcn/ui, registry install
     - Maintains shadcn workflows with neobrutalist styling
- **Migration approach (using neobrutal-ui)**:
  - **Phase 1: Setup and installation**
    - Run `npx neobrutal init` to initialize project
    - Install core components: `npx neobrutal add button card input select dialog alert`
    - Update `/package.json` with new dependencies
  - **Phase 2: Update globals.css with neobrutalism tokens**
    ```css
    :root {
      --border: 3px solid #000;
      --shadow-sm: 3px 3px 0 0 #000;
      --shadow: 5px 5px 0 0 #000;
      --shadow-lg: 8px 8px 0 0 #000;
      --radius: 0;
      /* Palette: neutral base + loud accents */
      --bg: #FFFDF5;
      --accent: #FFD23F; /* or brand color */
    }
    ```
  - **Phase 3: Replace DaisyUI components with neobrutalism equivalents**
    - Button.tsx → Import from neobrutal-ui or refactor with neobrutalist styles
    - Card.tsx → Import NeoCard or refactor with hard shadows
    - Input fields → Replace DaisyUI input-bordered with neobrutalist input
    - Replace all DaisyUI utility classes with custom neobrutalist classes
  - **Phase 4: Update custom components to use neobrutalism tokens**
    - Refactor Button.tsx with thick borders and hard shadows:
      ```tsx
      className="border-3 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]"
      ```
    - Refactor Card.tsx with square corners and hard shadows
    - Update all interactive states (hover, active, focus)
  - **Phase 5: Update all page components**
    - Replace DaisyUI classes across all 22 TSX files
    - Update form components (login, signup, admin forms)
    - Update navigation and layout components
    - Ensure consistent neobrutalist styling throughout
- **Files to modify**:
  - `/package.json` - Add neobrutal-ui dependency
  - `/src/app/globals.css` - Replace monochromatic theme with neobrutalism tokens
  - `/src/components/Button.tsx` - Refactor to neobrutalist styles
  - `/src/components/Card.tsx` - Refactor to neobrutalist styles
  - `/src/components/DeleteTextModal.tsx` - Update dialog styling
  - `/src/components/QuizQuestion.tsx` - Update radio button styling
  - `/src/components/RichTextEditor.tsx` - Update editor container styling
  - `/src/components/ScrollLockTextArea.tsx` - Update textarea styling
  - `/src/components/Sidebar.tsx` - Update navigation styling
  - `/src/components/Timer.tsx` - Update display styling
  - All 22 page components in `/src/app/` - Replace DaisyUI classes
- **Design considerations for QickReed**:
  - **Brand colors**: Adapt current monochromatic palette to neobrutalism
    - Keep black/white base for readability
    - Add 1-2 accent colors (e.g., #FFD23F yellow, #FF6B6B pink)
    - Use black for all borders and shadows
  - **Typography**: Maintain Geist font, add bold weights for headlines
  - **Accessibility**: Neobrutalism naturally has high contrast (WCAG AA compliant)
    - Verify color pairings meet contrast requirements
    - Ensure focus states are visible (thick outline)
    - Test with screen readers (semantic HTML remains important)
  - **Performance**: Neobrutalism is CSS-friendly, no performance impact
  - **User experience**: Balance bold aesthetics with QickReed's focus on reading
    - Keep reading interfaces clean (less aggressive neobrutalism)
    - Apply bold styling to navigation, buttons, and interactive elements
- **Migration checklist**:
  - [ ] Install neobrutal-ui CLI and core components
  - [ ] Update globals.css with neobrutalism design tokens
  - [ ] Refactor Button.tsx with neobrutalist styles
  - [ ] Refactor Card.tsx with neobrutalist styles
  - [ ] Update all form components (inputs, selects, textareas)
  - [ ] Replace DaisyUI classes in auth pages (login, signup)
  - [ ] Replace DaisyUI classes in dashboard
  - [ ] Replace DaisyUI classes in admin panel
  - [ ] Replace DaisyUI classes in assessment pages
  - [ ] Replace DaisyUI classes in training pages
  - [ ] Test all interactive states (hover, active, focus)
  - [ ] Verify accessibility (contrast, focus, screen readers)
  - [ ] Test responsive design on mobile devices
- **Success criteria**: All pages use neobrutalism components consistently, design matches neobrutalism.dev style guide, no DaisyUI dependencies remain, accessibility standards maintained, responsive design preserved
