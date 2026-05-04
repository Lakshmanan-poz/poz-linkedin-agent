"use client";

import { Badge } from "@/components/ui/badge";
import { POST_TYPE_LABELS } from "@/lib/constants";
import { PostType } from "@/lib/types";

const TYPE_COLORS: Record<PostType, string> = {
  problem_solution: "bg-orange-100 text-orange-700",
  educational: "bg-sky-100 text-sky-700",
  execution: "bg-violet-100 text-violet-700",
  carousel: "bg-pink-100 text-pink-700",
};

export function PostTypeBadge({ type }: { type: PostType }) {
  return (
    <Badge variant="secondary" className={TYPE_COLORS[type]}>
      {POST_TYPE_LABELS[type]}
    </Badge>
  );
}
