"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { Post, PostStatus, PostType } from "@/lib/types";
import { addDays, startOfWeek, format, parseISO } from "date-fns";

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return monday;
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [target, setTarget] = useState(5);

  useEffect(() => {
    const weekStr = format(weekStart, "yyyy-MM-dd");
    fetch(`/api/calendar?week=${weekStr}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings) => {
        if (settings.posts_per_week_target) setTarget(Number(settings.posts_per_week_target));
      });
  }, [weekStart]);

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const getPostsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return posts.filter((p) => p.scheduled_date === dayStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-muted-foreground">
            Week of {format(weekStart, "MMM d")} - {format(addDays(weekStart, 4), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{posts.length}</span>
            <span className="text-muted-foreground">/{target} posts scheduled</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This Week</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={`text-center py-2 rounded-lg ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="text-xs font-medium">{format(day, "EEE")}</div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {dayPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                        <div className="flex flex-col gap-1">
                          <PostTypeBadge type={post.post_type as PostType} />
                          <PostStatusBadge status={post.status as PostStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">{post.author_name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {dayPosts.length === 0 && (
                  <div className="border border-dashed rounded-lg p-4 text-center">
                    <Link href="/posts/new" className="text-xs text-muted-foreground hover:text-primary">
                      + Add post
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
