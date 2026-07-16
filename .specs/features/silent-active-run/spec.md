# Silent Active Run — Feature Specification

## Overview
Enable users to queue multiple training texts and run through them sequentially without manual intervention between sessions. The "silent" aspect means the system handles session transitions automatically, reducing friction for high-volume training.

## Problem Statement
Currently, users must manually select each text and click through each training session. For users doing high-volume training (e.g., multiple sessions per day), this creates friction that may reduce training consistency.

## User Stories

### US-1: Batch Training Queue
> As a user, I want to queue multiple training texts so I can run through them consecutively without manual selection between each session.

### US-2: Unattended Training
> As a user, I want the training to continue automatically through my queued texts so I can focus on reading without managing the interface.

### US-3: Queue Management
> As a user, I want to view and manage my training queue so I can add, remove, or reorder texts before starting.

## Functional Requirements

### FR-1: Training Queue
- Users can add texts to a training queue (max 10 texts)
- Queue persists across sessions (stored in user preferences or local storage)
- Users can reorder queue via drag-and-drop
- Users can remove individual texts from queue
- Clear all queue option

### FR-2: Silent Active Run Mode
- Single "Start Queue" button initiates continuous training
- After each text completes (quiz submitted), system automatically loads next text
- No interstitial screens between texts (except brief transition indicator)
- User can pause/resume queue at any time
- Queue auto-stops after all texts complete or on user intervention

### FR-3: Progress Tracking
- Visual indicator showing queue progress (e.g., "3 of 10 texts")
- Each text session records independently in training history
- Aggregate results shown after queue completes

### FR-4: Queue Settings
- Target WPM applies to all texts in queue (can override per-text)
- Break option between sessions (3-5 second visual pause)
- Auto-advance delay setting (default: 2 seconds)

## Non-Functional Requirements

### NFR-1: Performance
- Queue state loads in < 200ms
- Text transitions complete in < 500ms

### NFR-2: Error Handling
- If a text fails to load, skip to next and log error
- Quiz failure doesn't stop queue (continues to next text)
- Network interruption pauses queue, resumes when connection restored

### NFR-3: Accessibility
- Queue progress announced to screen readers
- Pause button keyboard-accessible
- Transition sounds optional (off by default)

## UI/UX Specification

### Queue Panel Component
- Collapsible panel on Training page
- Shows queued texts with drag handles
- "Add to Queue" button opens text selection modal
- Start Queue button prominent when queue has items

### Active Run UI
- Minimal chrome - focuses on RSVP display
- Small progress indicator top-right
- Floating pause/stop button
- Skip to next text option

### Desktop (≥1024px)
- Queue panel: right sidebar, 320px width
- Active run: fullscreen immersive mode

### Tablet (768px-1023px)
- Queue panel: bottom drawer
- Active run: fullscreen

### Mobile (<768px)
- Queue panel: full-screen modal
- Active run: fullscreen with larger touch targets

## Technical Implementation

### Database Changes
No schema changes required. Queue stored in localStorage or user preferences table.

### API Endpoints
- `GET /api/training/queue` - Fetch user's queue
- `POST /api/training/queue` - Update queue (add/remove/reorder)
- `POST /api/training/queue/start` - Initiate batch run
- `POST /api/training/queue/pause` - Pause queue
- `POST /api/training/queue/resume` - Resume queue

### Client State
- React Context for queue state
- localStorage fallback for unauthenticated users

### Key Components to Create
1. `TrainingQueuePanel` - Queue management UI
2. `QueueTextCard` - Individual queued text display
3. `SilentActiveRunner` - Orchestrates continuous training
4. `QueueProgressIndicator` - Shows position in queue

## Acceptance Criteria

### AC-1: Queue Management
- [ ] User can add texts to queue from selection modal
- [ ] User can remove texts from queue
- [ ] User can reorder queue via drag-and-drop
- [ ] Queue persists across page reloads

### AC-2: Silent Run Execution
- [ ] Start Queue initiates first text automatically
- [ ] After quiz completion, next text loads within 2 seconds
- [ ] User can pause queue at any time
- [ ] Queue stops gracefully when all texts complete

### AC-3: Progress Visibility
- [ ] Current position shown during run (e.g., "2/10")
- [ ] Individual session results recorded in history
- [ ] Aggregate summary shown after queue completion

### AC-4: Edge Cases
- [ ] Empty queue shows helpful empty state
- [ ] Failed text load skips to next with notification
- [ ] User logout mid-queue preserves queue state

## Open Questions

1. Should queue be user-specific or device-specific? (User-specific requires auth)
2. Maximum queue size: 10 or allow unlimited?
3. Include diagnostic texts in queue?
4. Queue sharing between devices?

## Dependencies
- None (uses existing training infrastructure)

## Priority
Medium - Improves training consistency but not blocking for MVP