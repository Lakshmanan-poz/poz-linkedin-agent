export type PostType = "problem_solution" | "educational" | "execution" | "carousel";

export type PostStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved_for_design"
  | "design_in_progress"
  | "ready_to_publish"
  | "published";

export type TeamRole = "member" | "lead" | "designer";

export type AuthRole = "employee" | "admin" | "designer" | "superadmin";

export interface TeamMember {
  id: number;
  name: string;
  email: string | null;
  role: TeamRole;
  auth_role: AuthRole;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  post_type: PostType;
  status: PostStatus;
  platform: string;
  author_id: number;
  assigned_designer_id: number | null;
  scheduled_date: string | null;
  published_url: string | null;
  ai_prompt: string | null;
  ai_model: string | null;
  carousel_slides: string | null;
  hashtags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  designer_name?: string;
}

export interface PostRevision {
  id: number;
  post_id: number;
  content: string;
  revised_by: number;
  revision_type: "ai_generated" | "manual_edit" | "ai_regenerated";
  created_at: string;
  revised_by_name?: string;
}

export interface PostStatusHistory {
  id: number;
  post_id: number;
  from_status: string | null;
  to_status: string;
  changed_by: number;
  note: string | null;
  created_at: string;
  changed_by_name?: string;
}

export interface PromptTemplate {
  id: number;
  name: string;
  post_type: PostType;
  system_prompt: string;
  user_prompt_template: string;
  example_output: string | null;
  is_default: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  post_id: number | null;
  message: string;
  is_read: boolean;
  created_by: number | null;
  created_at: string;
}

export interface DashboardStats {
  totalPosts: number;
  postsThisWeek: number;
  inPipeline: number;
  publishedThisMonth: number;
  postsByStatus: Record<PostStatus, number>;
  postsByType: Record<PostType, number>;
  teamContributions: { name: string; posts_created: number; posts_published: number }[];
  recentActivity: PostStatusHistory[];
}
