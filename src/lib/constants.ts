import { PostStatus, PostType, AuthRole } from "./types";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  problem_solution: "Problem-Solution",
  educational: "Educational",
  execution: "Execution / Build",
  carousel: "Carousel",
};

export const POST_TYPE_DESCRIPTIONS: Record<PostType, string> = {
  problem_solution: "Name a problem your audience faces, agitate it, and present a solution",
  educational: "Teach a concept, framework, or methodology with actionable takeaways",
  execution: "Share what you're building right now — challenges, decisions, lessons",
  carousel: "Multi-slide visual content for high engagement",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  approved_for_design: "Approved for Design",
  design_in_progress: "Design in Progress",
  ready_to_publish: "Ready to Publish",
  published: "Published",
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  draft:               "bg-gray-100    text-gray-600    dark:bg-gray-800/70     dark:text-gray-300",
  submitted:           "bg-amber-100   text-amber-700   dark:bg-amber-900/40    dark:text-amber-300",
  under_review:        "bg-amber-100   text-amber-700   dark:bg-amber-900/40    dark:text-amber-300",
  changes_requested:   "bg-red-100     text-red-700     dark:bg-red-900/40      dark:text-red-300",
  approved_for_design: "bg-sky-100     text-sky-700     dark:bg-sky-900/40      dark:text-sky-300",
  design_in_progress:  "bg-sky-100     text-sky-700     dark:bg-sky-900/40      dark:text-sky-300",
  ready_to_publish:    "bg-green-100   text-green-700   dark:bg-green-900/40    dark:text-green-300",
  published:           "bg-green-100   text-green-700   dark:bg-green-900/40    dark:text-green-300",
};

export const VALID_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "changes_requested", "approved_for_design"],
  under_review: ["changes_requested", "approved_for_design"],
  changes_requested: ["submitted"],
  approved_for_design: ["design_in_progress", "under_review"],
  design_in_progress: ["ready_to_publish", "approved_for_design"],
  ready_to_publish: ["published", "design_in_progress"],
  published: [],
};

// Which roles can perform each transition
export const TRANSITION_ROLES: Record<string, AuthRole[]> = {
  // Employee submits their draft for review
  "draft->submitted": ["employee", "admin", "superadmin"],
  // Reviewer picks up submitted post to actively review
  "submitted->under_review": ["admin", "superadmin"],
  // Reviewer requests changes (from submitted or under_review)
  "submitted->changes_requested": ["admin", "superadmin"],
  "under_review->changes_requested": ["admin", "superadmin"],
  // Admin fast-tracks directly to designer (skip under_review)
  "submitted->approved_for_design": ["admin", "superadmin"],
  // Reviewer approves for design
  "under_review->approved_for_design": ["admin", "superadmin"],
  // Employee resubmits after changes
  "changes_requested->submitted": ["employee", "admin", "superadmin"],
  // Reviewer sends back from approved_for_design to under_review
  "approved_for_design->under_review": ["admin", "superadmin"],
  // Designer picks up for design work
  "approved_for_design->design_in_progress": ["designer", "admin", "superadmin"],
  // Designer sends back
  "design_in_progress->approved_for_design": ["designer", "admin", "superadmin"],
  // Designer marks design complete
  "design_in_progress->ready_to_publish": ["designer", "superadmin"],
  // Reviewer sends back to designer
  "ready_to_publish->design_in_progress": ["admin", "superadmin"],
  // Reviewer/Admin publishes
  "ready_to_publish->published": ["admin", "superadmin"],
};

export const ALL_STATUSES: PostStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved_for_design",
  "design_in_progress",
  "ready_to_publish",
  "published",
];

export const ALL_POST_TYPES: PostType[] = [
  "problem_solution",
  "educational",
  "execution",
  "carousel",
];
