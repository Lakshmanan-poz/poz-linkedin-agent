"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { ALL_STATUSES, ALL_POST_TYPES, POST_STATUS_LABELS, POST_TYPE_LABELS } from "@/lib/constants";
import { Post, PostStatus, PostType, TeamMember } from "@/lib/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/team").then((r) => r.json()),
    ]).then(([teamData]) => {
      setTeam(teamData);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("post_type", typeFilter);
    if (authorFilter) params.set("author_id", authorFilter);
    if (search) params.set("search", search);

    setLoading(true);
    fetch(`/api/posts?${params}`)
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter, typeFilter, authorFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts</h2>
          <p className="text-muted-foreground">{posts.length} total posts</p>
        </div>
        <Link href="/posts/new">
          <Button>Create New Post</Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{POST_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ALL_POST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{POST_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={authorFilter} onValueChange={(v) => setAuthorFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Authors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authors</SelectItem>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : posts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No posts found. Create your first post!</TableCell></TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell><PostTypeBadge type={post.post_type as PostType} /></TableCell>
                  <TableCell>{post.author_name}</TableCell>
                  <TableCell><PostStatusBadge status={post.status as PostStatus} /></TableCell>
                  <TableCell className="text-sm">{post.scheduled_date || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
