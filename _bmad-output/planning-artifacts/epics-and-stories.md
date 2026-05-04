# POZ Social Media Agent — Epics & Stories

**Created:** 2026-03-15
**Project:** POZ Social Media Agent (Next.js + SQLite + OpenAI)

---

## Current State Summary

The application has a solid foundation with:
- Post creation wizard (4 post types) with AI generation
- Post listing with filters/search
- 3 AI agents with 18 skill components (fully built)
- Dashboard with analytics
- Calendar view (weekly, with navigation)
- Team management (CRUD)
- Template management (CRUD)
- Settings page (OpenAI config, brand, content goals)
- SQLite database with schema, seeding, and indexes
- Status workflow pipeline (draft → published)

**Key gaps:** Post detail/edit page, LinkedIn publishing, notifications, testing, and polish.

---

## Epic 1: Post Detail & Editing

> Enable users to view, edit, and manage individual posts through their full lifecycle.

### Story 1.1 — Post Detail Page (View Mode)

**Priority:** P0 (Critical)
**Estimate:** M

**Description:**
Create `/posts/[id]` page that displays a post's full content, metadata, status, author, assigned designer, scheduled date, hashtags, and carousel slides (if applicable).

**Acceptance Criteria:**
- Route `/posts/[id]` renders post content from `GET /api/posts/[id]`
- Shows title, body, post type badge, status badge, author, creation date
- Carousel posts display slides in a preview layout
- Shows hashtags as badges
- Shows assigned designer (if any)
- Shows scheduled date (if set)
- Loading and error states handled
- 404 page if post not found

**Technical Notes:**
- API route `GET /api/posts/[id]` already exists
- Reuse `PostStatusBadge` and `PostTypeBadge` components

---

### Story 1.2 — Post Inline Editing

**Priority:** P0 (Critical)
**Estimate:** M

**Description:**
Add inline editing capability to the post detail page so users can modify post title, body, hashtags, and carousel slides.

**Acceptance Criteria:**
- Edit button toggles between view and edit modes
- Title and body are editable via text inputs
- Hashtags editable (add/remove)
- Carousel slides editable (reorder, edit text, add/remove slides)
- Save button calls `PUT /api/posts/[id]`
- Creates a revision entry on save
- Cancel discards unsaved changes
- Toast confirmation on save success/failure

**Technical Notes:**
- API route `PUT /api/posts/[id]` already exists
- Revision tracking via `addRevision()` in `/lib/db/posts.ts`

---

### Story 1.3 — Post Status Transitions

**Priority:** P0 (Critical)
**Estimate:** S

**Description:**
Add status transition controls to the post detail page, allowing users to move posts through the workflow pipeline.

**Acceptance Criteria:**
- Show current status prominently
- Display available next statuses based on `VALID_TRANSITIONS` map
- Transition button for each valid next status
- Confirmation dialog before transitioning
- Status history timeline displayed below post content
- Calls `POST /api/posts/[id]/status` on transition
- Toast feedback on success/failure

**Technical Notes:**
- Valid transitions defined in `/lib/constants.ts`
- `transitionPostStatus()` enforces valid transitions server-side
- `post_status_history` table tracks audit trail

---

### Story 1.4 — Post Revision History

**Priority:** P1 (High)
**Estimate:** S

**Description:**
Display revision history on the post detail page and allow viewing previous versions.

**Acceptance Criteria:**
- Collapsible "Revision History" section on post detail page
- Lists all revisions with timestamp and editor name
- Click a revision to view its content in a read-only overlay/modal
- Shows diff summary (what changed) if feasible
- Calls `GET /api/posts/[id]/revisions`

**Technical Notes:**
- `getRevisions()` already implemented in DB layer
- API route exists at `/api/posts/[id]/revisions`

---

### Story 1.5 — Designer Assignment

**Priority:** P1 (High)
**Estimate:** S

**Description:**
Allow assigning a designer to a post from the post detail page when the post reaches "ready_for_design" status.

**Acceptance Criteria:**
- When post is in `ready_for_design` status, show "Assign Designer" dropdown
- Dropdown populated from team members with "designer" role
- Assigning a designer transitions post to `with_designer` status
- Assigned designer name shown on post detail
- Toast confirmation on assignment

---

## Epic 2: Post List Enhancements

> Improve the posts table with bulk actions and better UX.

### Story 2.1 — Post Delete Functionality

**Priority:** P1 (High)
**Estimate:** S

**Description:**
Add ability to delete draft posts from the post list and detail pages.

**Acceptance Criteria:**
- Delete button visible only for posts in `draft` status
- Confirmation dialog before deletion
- Calls `DELETE /api/posts/[id]` (needs new API route)
- Removes post from list without full page reload
- Toast confirmation

**Technical Notes:**
- Need to add `DELETE` handler to `/api/posts/[id]/route.ts`
- Need to add `deletePost()` to `/lib/db/posts.ts`

---

### Story 2.2 — Bulk Status Transitions

**Priority:** P2 (Medium)
**Estimate:** M

**Description:**
Allow selecting multiple posts and transitioning them to the same status in bulk.

**Acceptance Criteria:**
- Checkbox selection on post rows
- "Select All" checkbox in header
- Bulk action toolbar appears when posts selected
- Dropdown to choose target status (only shows statuses valid for ALL selected posts)
- Confirmation dialog showing count of posts to transition
- Progress indicator during bulk operation
- Toast with success/failure count

---

## Epic 3: Calendar & Scheduling

> Enhance the calendar with scheduling capabilities.

### Story 3.1 — Schedule Post from Detail Page

**Priority:** P1 (High)
**Estimate:** S

**Description:**
Add date picker on post detail page to schedule or reschedule a post.

**Acceptance Criteria:**
- Date picker component on post detail page
- Selecting a date updates `scheduled_date` via `PUT /api/posts/[id]`
- Clear button to unschedule
- Post appears on calendar after scheduling
- Toast confirmation

---

### Story 3.2 — Calendar Quick Create

**Priority:** P2 (Medium)
**Estimate:** M

**Description:**
Allow creating a new post directly from a calendar day slot with the date pre-filled.

**Acceptance Criteria:**
- "+" button on each calendar day links to `/posts/new?date=YYYY-MM-DD`
- Post creation wizard pre-fills scheduled date from URL param
- After creation, return to calendar view
- New post appears on the correct day

**Technical Notes:**
- Calendar already links to `/posts/new` from empty day slots
- Need to pass and read date query param in creation wizard

---

## Epic 4: Agent Output Integration

> Connect agent skill outputs to the post creation workflow.

### Story 4.1 — Create Post from Agent Output

**Priority:** P1 (High)
**Estimate:** M

**Description:**
Allow users to convert a post-generation agent output directly into a draft post.

**Acceptance Criteria:**
- "Create Post" button on post-generation skill output
- Pre-fills post creation form with generated content
- Sets post type based on the output format
- Links agent output to created post (reference)
- Redirects to post detail page after creation

---

### Story 4.2 — Agent Output History & Search

**Priority:** P2 (Medium)
**Estimate:** M

**Description:**
Add a dedicated page to browse, search, and filter all agent outputs.

**Acceptance Criteria:**
- New page at `/agents/outputs` listing all saved outputs
- Filter by agent, skill, status (draft/finalized/archived), date range
- Search by title
- Click to view full output detail
- Delete/archive actions

**Technical Notes:**
- API routes for agent outputs already exist
- `GET /api/agents/outputs` supports listing

---

## Epic 5: LinkedIn Publishing Integration

> Enable direct publishing to LinkedIn from the platform.

### Story 5.1 — LinkedIn OAuth Setup

**Priority:** P2 (Medium)
**Estimate:** L

**Description:**
Implement LinkedIn OAuth 2.0 flow to connect a LinkedIn account for publishing.

**Acceptance Criteria:**
- "Connect LinkedIn" button on Settings page
- OAuth 2.0 authorization flow with LinkedIn API
- Store access token securely (encrypted in DB or env)
- Show connection status (connected/disconnected)
- "Disconnect" button to revoke access
- Token refresh handling

---

### Story 5.2 — Publish to LinkedIn

**Priority:** P2 (Medium)
**Estimate:** L

**Description:**
Add ability to publish a post directly to LinkedIn when it reaches "ready_to_publish" status.

**Acceptance Criteria:**
- "Publish to LinkedIn" button on post detail (when `ready_to_publish`)
- Preview of how post will look on LinkedIn
- Calls LinkedIn Share API to create post
- Updates post status to `published` on success
- Stores LinkedIn post URL in `linkedin_url` field
- Error handling with retry option

---

## Epic 6: Notifications & Collaboration

> Add real-time awareness for team collaboration.

### Story 6.1 — In-App Notification System

**Priority:** P2 (Medium)
**Estimate:** L

**Description:**
Build notification system to alert team members about post status changes and assignments.

**Acceptance Criteria:**
- Notification bell icon in header with unread count
- Notification dropdown showing recent notifications
- Notifications triggered on: status transitions, designer assignment, new posts
- Mark as read (individual and all)
- Notification preferences in settings

**Technical Notes:**
- New `notifications` table in DB
- New API routes for notification CRUD
- Polling-based initially (can upgrade to WebSocket later)

---

### Story 6.2 — Post Comments

**Priority:** P3 (Low)
**Estimate:** M

**Description:**
Add commenting functionality on the post detail page for team feedback.

**Acceptance Criteria:**
- Comment thread on post detail page
- Add comment with text input
- Show commenter name, avatar, timestamp
- Edit/delete own comments
- Comment count visible on post list

**Technical Notes:**
- New `post_comments` table
- New API routes for comment CRUD

---

## Epic 7: Analytics & Reporting

> Expand dashboard analytics and add reporting features.

### Story 7.1 — Enhanced Dashboard Metrics

**Priority:** P2 (Medium)
**Estimate:** M

**Description:**
Add more detailed analytics to the dashboard including trends, team productivity, and content mix.

**Acceptance Criteria:**
- Posts created per week trend chart (last 8 weeks)
- Content type distribution (pie/bar chart)
- Average time in each status stage
- Top contributors leaderboard
- Pipeline velocity metrics

**Technical Notes:**
- May need charting library (recharts or chart.js)
- Extend `getDashboardStats()` or add new queries

---

### Story 7.2 — Export Reports

**Priority:** P3 (Low)
**Estimate:** M

**Description:**
Allow exporting post data and analytics as CSV or PDF.

**Acceptance Criteria:**
- "Export" button on posts list page
- Export filtered posts as CSV
- Export dashboard analytics as PDF
- Date range selector for export scope

---

## Epic 8: Testing & Quality

> Establish test coverage for critical paths.

### Story 8.1 — Database Layer Unit Tests

**Priority:** P1 (High)
**Estimate:** M

**Description:**
Add unit tests for all database functions in `/lib/db/`.

**Acceptance Criteria:**
- Test setup with in-memory SQLite
- Tests for all CRUD operations (posts, team, templates, settings, agent-outputs)
- Tests for status transition validation
- Tests for dashboard stats aggregation
- Test for revision history
- CI-ready test configuration

**Technical Notes:**
- Use Vitest or Jest
- Mock or use separate test database

---

### Story 8.2 — API Route Integration Tests

**Priority:** P1 (High)
**Estimate:** M

**Description:**
Add integration tests for all API routes.

**Acceptance Criteria:**
- Test each API endpoint (GET, POST, PUT, DELETE)
- Test validation and error responses
- Test status transition enforcement
- Test pagination and filtering
- Minimum 80% route coverage

---

### Story 8.3 — E2E Tests for Core Flows

**Priority:** P2 (Medium)
**Estimate:** L

**Description:**
Add end-to-end tests for the critical user journeys.

**Acceptance Criteria:**
- E2E framework setup (Playwright or Cypress)
- Test: Create a new post via wizard
- Test: View and edit a post
- Test: Transition post through full status pipeline
- Test: Use an agent skill and save output
- Test: Navigate calendar and schedule post

---

## Sprint Recommendation (Priority Order)

### Sprint 1 — Core Post Management
- Story 1.1 — Post Detail Page (View Mode) **[P0]**
- Story 1.2 — Post Inline Editing **[P0]**
- Story 1.3 — Post Status Transitions **[P0]**

### Sprint 2 — Post Lifecycle Completion
- Story 1.4 — Post Revision History **[P1]**
- Story 1.5 — Designer Assignment **[P1]**
- Story 2.1 — Post Delete Functionality **[P1]**
- Story 3.1 — Schedule Post from Detail Page **[P1]**

### Sprint 3 — Agent Integration & Testing
- Story 4.1 — Create Post from Agent Output **[P1]**
- Story 8.1 — Database Layer Unit Tests **[P1]**
- Story 8.2 — API Route Integration Tests **[P1]**

### Sprint 4 — Enhancements
- Story 2.2 — Bulk Status Transitions **[P2]**
- Story 3.2 — Calendar Quick Create **[P2]**
- Story 4.2 — Agent Output History & Search **[P2]**
- Story 7.1 — Enhanced Dashboard Metrics **[P2]**

### Sprint 5 — LinkedIn & Collaboration
- Story 5.1 — LinkedIn OAuth Setup **[P2]**
- Story 5.2 — Publish to LinkedIn **[P2]**
- Story 6.1 — In-App Notification System **[P2]**
- Story 8.3 — E2E Tests for Core Flows **[P2]**

### Backlog
- Story 6.2 — Post Comments **[P3]**
- Story 7.2 — Export Reports **[P3]**
