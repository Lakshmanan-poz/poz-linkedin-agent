"use client";

import { Badge } from "@/components/ui/badge";
import { POST_STATUS_LABELS, POST_STATUS_COLORS } from "@/lib/constants";
import { PostStatus } from "@/lib/types";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return (
    <Badge variant="secondary" className={POST_STATUS_COLORS[status]}>
      {POST_STATUS_LABELS[status]}
    </Badge>
  );
}
