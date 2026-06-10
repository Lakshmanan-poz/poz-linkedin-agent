"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PostType } from "@/lib/types";
import { toast } from "sonner";

type Mode = "choose" | "ai" | "manual";
type AiStep = "type" | "prompt" | "preview";
type ManualStep = "type" | "write";

/* ─── Step indicator ─────────────────────────────────────────────────────────── */
function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((label, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div className={`flex items-center gap-1.5 ${isActive ? "text-primary font-medium" : isPast ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {isPast ? "✓" : i + 1}
              </div>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Format selector (shared) ───────────────────────────────────────────────── */
function FormatSelector({ onSelect }: { onSelect: (format: "single" | "carousel") => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect("single")}
        className="group text-left rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/3 transition-all p-6 space-y-3"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-base group-hover:text-primary transition-colors">Single Page</p>
          <p className="text-sm text-muted-foreground mt-1">A single LinkedIn post — hook, body, and call to action on one page.</p>
        </div>
      </button>

      <button
        onClick={() => onSelect("carousel")}
        className="group text-left rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/3 transition-all p-6 space-y-3"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-base group-hover:text-primary transition-colors">Carousel</p>
          <p className="text-sm text-muted-foreground mt-1">Multi-slide carousel post with individual slides for high engagement.</p>
        </div>
      </button>
    </div>
  );
}

type CarouselSlide = { title: string; body: string };

export default function NewPostPage() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [mode, setMode] = useState<Mode>("choose");

  /* ── AI flow state ─────────────────────────────────────────────────── */
  const [aiStep, setAiStep] = useState<AiStep>("type");
  const [aiPostType, setAiPostType] = useState<PostType | null>(null);
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [aiSlideCount, setAiSlideCount] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, unknown> | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");

  /* ── Manual flow state ─────────────────────────────────────────────── */
  const [manualStep, setManualStep] = useState<ManualStep>("type");
  const [manualPostType, setManualPostType] = useState<PostType | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualPlatform, setManualPlatform] = useState("linkedin");
  const [manualHashtags, setManualHashtags] = useState("");

  /* ── Manual carousel state ─────────────────────────────────────────── */
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([{ title: "", body: "" }]);
  const [carouselCaption, setCarouselCaption] = useState("");
  const [carouselHashtags, setCarouselHashtags] = useState("");

  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  /* ── Submit for review helper ──────────────────────────────────────── */
  const submitForReview = async (postId: number) => {
    if (!currentUser) throw new Error("Not logged in");
    const res = await fetch(`/api/posts/${postId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "submitted", changed_by: currentUser.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to submit for review");
    }
  };

  /* ── Generate + send to review in one step ─────────────────────────── */
  const handleGenerateAndReview = async () => {
    if (!topic.trim() || !aiPostType || !currentUser) return;
    setReviewing(true);
    try {
      // Step 1: Generate content
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          post_type: aiPostType,
          additional_context: additionalContext,
          ...(aiPostType === "carousel" ? { slide_count: aiSlideCount } : {}),
        }),
      });
      const data = await genRes.json();
      if (!genRes.ok) throw new Error(data.error || "Generation failed");

      // Step 2: Build and save post
      const title = data.title || topic;
      const content = aiPostType === "carousel"
        ? (data.captionText || title)
        : (data.fullPost || `${data.hook}\n\n${data.body}\n\n${data.callToAction}`);

      const postBody: Record<string, unknown> = {
        title,
        content,
        post_type: aiPostType,
        author_id: currentUser.id,
        ai_prompt: topic,
        ai_model: "gpt-4o",
      };
      if (Array.isArray(data.hashtags)) postBody.hashtags = JSON.stringify(data.hashtags);
      if (aiPostType === "carousel" && data.slides) {
        postBody.carousel_slides = JSON.stringify({ slides: data.slides, closingSlide: data.closingSlide, caption: content });
      }

      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody),
      });
      const post = await saveRes.json();
      if (!saveRes.ok) throw new Error(post.error || "Failed to save");

      // Step 3: Submit for review
      await submitForReview(post.id);
      toast.success("Post generated and submitted for review!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setReviewing(false);
    }
  };

  /* ── Mode helpers (reset step on entry) ────────────────────────────── */
  const enterManual = () => {
    setManualStep("type");
    setManualPostType(null);
    setManualTitle("");
    setManualContent("");
    setManualHashtags("");
    setCarouselSlides([{ title: "", body: "" }]);
    setCarouselCaption("");
    setCarouselHashtags("");
    setMode("manual");
  };

  const enterAi = () => {
    setAiStep("type");
    setAiPostType(null);
    setTopic("");
    setAdditionalContext("");
    setGeneratedContent(null);
    setEditedContent("");
    setEditedTitle("");
    setMode("ai");
  };

  /* ── AI handlers ───────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!topic.trim() || !aiPostType) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          post_type: aiPostType,
          additional_context: additionalContext,
          ...(aiPostType === "carousel" ? { slide_count: aiSlideCount } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedContent(data);
      if (aiPostType === "carousel") {
        setEditedTitle(data.title || topic);
        setEditedContent(data.captionText || "");
      } else {
        setEditedTitle(data.title || topic);
        setEditedContent(data.fullPost || `${data.hook}\n\n${data.body}\n\n${data.callToAction}`);
      }
      setAiStep("preview");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleAiSave = async (toReview = false) => {
    if (!currentUser || !aiPostType) return;
    toReview ? setReviewing(true) : setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: editedTitle,
        content: editedContent,
        post_type: aiPostType,
        author_id: currentUser.id,
        ai_prompt: topic,
        ai_model: "gpt-4o",
      };
      if (generatedContent) {
        const hashtags = (generatedContent as Record<string, unknown>).hashtags;
        if (Array.isArray(hashtags)) body.hashtags = JSON.stringify(hashtags);
        if (aiPostType === "carousel" && (generatedContent as Record<string, unknown>).slides) {
          body.carousel_slides = JSON.stringify({
            slides: (generatedContent as Record<string, unknown>).slides,
            closingSlide: (generatedContent as Record<string, unknown>).closingSlide,
            caption: editedContent,
          });
        }
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const post = await res.json();
      if (!res.ok) throw new Error(post.error || "Failed to save");
      if (toReview) {
        await submitForReview(post.id);
        toast.success("Post submitted for review!");
        router.push("/dashboard");
      } else {
        toast.success("Post saved as draft!");
        router.push(`/posts/${post.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  };

  /* ── Manual single-page save ───────────────────────────────────────── */
  const handleManualSave = async (toReview = false) => {
    if (!currentUser || !manualPostType || !manualTitle.trim() || !manualContent.trim()) return;
    toReview ? setReviewing(true) : setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: manualTitle.trim(),
        content: manualContent.trim(),
        post_type: manualPostType,
        author_id: currentUser.id,
        platform: manualPlatform,
      };
      if (manualHashtags.trim()) {
        const tags = manualHashtags.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));
        body.hashtags = JSON.stringify(tags);
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const post = await res.json();
      if (!res.ok) throw new Error(post.error || "Failed to save");
      if (toReview) {
        await submitForReview(post.id);
        toast.success("Post submitted for review!");
        router.push("/dashboard");
      } else {
        toast.success("Post saved as draft!");
        router.push(`/posts/${post.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  };

  /* ── Manual carousel save ──────────────────────────────────────────── */
  const handleCarouselSave = async (toReview = false) => {
    if (!currentUser || !manualTitle.trim()) return;
    const validSlides = carouselSlides.filter((s) => s.title.trim() || s.body.trim());
    if (validSlides.length === 0) { toast.error("Add at least one slide"); return; }
    toReview ? setReviewing(true) : setSaving(true);
    try {
      const tags = carouselHashtags.trim()
        ? carouselHashtags.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`))
        : [];
      const carouselPayload = {
        type: "manual",
        slides: validSlides.map((s, i) => ({
          position: i + 1,
          title: s.title.trim(),
          body: s.body.trim(),
        })),
        caption: carouselCaption.trim(),
        hashtags: tags,
      };
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle.trim(),
          content: carouselCaption.trim() || manualTitle.trim(),
          post_type: "carousel",
          author_id: currentUser.id,
          carousel_slides: JSON.stringify(carouselPayload),
          hashtags: JSON.stringify(tags),
        }),
      });
      const post = await res.json();
      if (!res.ok) throw new Error(post.error || "Failed to save");
      if (toReview) {
        await submitForReview(post.id);
        toast.success("Carousel submitted for review!");
        router.push("/dashboard");
      } else {
        toast.success("Carousel saved as draft!");
        router.push(`/posts/${post.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
      setReviewing(false);
    }
  };

  /* ── Carousel slide helpers ────────────────────────────────────────── */
  const updateSlide = (i: number, field: keyof CarouselSlide, value: string) => {
    setCarouselSlides((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };
  const addSlide = () => setCarouselSlides((prev) => [...prev, { title: "", body: "" }]);
  const removeSlide = (i: number) => setCarouselSlides((prev) => prev.filter((_, idx) => idx !== i));

  /* ── Mode chooser ──────────────────────────────────────────────────── */
  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Post</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Choose how you want to create your post</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={enterManual}
            className="group text-left rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/3 transition-all p-6 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base group-hover:text-primary transition-colors">Write Manually</p>
              <p className="text-sm text-muted-foreground mt-1">Write your own content from scratch with full control over every word.</p>
            </div>
          </button>

          <button
            onClick={enterAi}
            className="group text-left rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/3 transition-all p-6 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base group-hover:text-primary transition-colors">Generate with AI</p>
              <p className="text-sm text-muted-foreground mt-1">Give a topic or idea and let AI draft a polished LinkedIn post for you.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ── Manual flow ───────────────────────────────────────────────────── */
  if (mode === "manual") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode("choose")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Write Manually</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Create your post from scratch</p>
          </div>
        </div>

        <StepBar steps={["Select Format", "Write Content"]} current={manualStep === "type" ? 0 : 1} />

        {manualStep === "type" && (
          <FormatSelector
            onSelect={(fmt) => {
              setManualPostType(fmt === "carousel" ? "carousel" : "problem_solution");
              setManualStep("write");
            }}
          />
        )}

        {/* ── Single page write form ── */}
        {manualStep === "write" && manualPostType && manualPostType !== "carousel" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Post Details</CardTitle>
              <CardDescription>Format: Single Page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="manual-title">Title</Label>
                <Input
                  id="manual-title"
                  placeholder="Give your post an internal title..."
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-content">Post Content</Label>
                <Textarea
                  id="manual-content"
                  placeholder="Write your post content here..."
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={10}
                  className="resize-y"
                />
                <p className="text-xs text-muted-foreground text-right">{manualContent.length} chars</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-platform">Platform</Label>
                  <select
                    id="manual-platform"
                    value={manualPlatform}
                    onChange={(e) => setManualPlatform(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-hashtags">Hashtags <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="manual-hashtags"
                    placeholder="#ai #linkedin #growth"
                    value={manualHashtags}
                    onChange={(e) => setManualHashtags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <Button variant="outline" onClick={() => setManualStep("type")} disabled={saving || reviewing}>Back</Button>
                <Button
                  variant="outline"
                  onClick={() => handleManualSave(false)}
                  disabled={saving || reviewing || !manualTitle.trim() || !manualContent.trim()}
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  onClick={() => handleManualSave(true)}
                  disabled={saving || reviewing || !manualTitle.trim() || !manualContent.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {reviewing ? "Submitting..." : "Send to Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Carousel write form ── */}
        {manualStep === "write" && manualPostType === "carousel" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Carousel Details</CardTitle>
                <CardDescription>Format: Carousel · {carouselSlides.length} slide{carouselSlides.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="carousel-title">Internal Title</Label>
                  <Input
                    id="carousel-title"
                    placeholder="Give this carousel an internal title..."
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Slides */}
            <div className="space-y-3">
              {carouselSlides.map((slide, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Slide {i + 1}
                    </CardTitle>
                    {carouselSlides.length > 1 && (
                      <button
                        onClick={() => removeSlide(i)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1.5">
                      <Label htmlFor={`slide-title-${i}`}>Slide Title</Label>
                      <Input
                        id={`slide-title-${i}`}
                        placeholder="Slide headline..."
                        value={slide.title}
                        onChange={(e) => updateSlide(i, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`slide-body-${i}`}>Slide Body</Label>
                      <Textarea
                        id={`slide-body-${i}`}
                        placeholder="Slide content..."
                        value={slide.body}
                        onChange={(e) => updateSlide(i, "body", e.target.value)}
                        rows={3}
                        className="resize-y"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addSlide}>
                + Add Slide
              </Button>
            </div>

            {/* Caption + hashtags */}
            <Card>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label htmlFor="carousel-caption">Caption <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    id="carousel-caption"
                    placeholder="LinkedIn caption for this carousel..."
                    value={carouselCaption}
                    onChange={(e) => setCarouselCaption(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="carousel-hashtags">Hashtags <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="carousel-hashtags"
                    placeholder="#ai #linkedin #growth"
                    value={carouselHashtags}
                    onChange={(e) => setCarouselHashtags(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setManualStep("type")} disabled={saving || reviewing}>Back</Button>
              <Button
                variant="outline"
                onClick={() => handleCarouselSave(false)}
                disabled={saving || reviewing || !manualTitle.trim()}
              >
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={() => handleCarouselSave(true)}
                disabled={saving || reviewing || !manualTitle.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {reviewing ? "Submitting..." : "Send to Review"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── AI flow ───────────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode("choose")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Generate with AI</h2>
          <p className="text-sm text-muted-foreground mt-0.5">AI-powered LinkedIn post generation</p>
        </div>
      </div>

      <StepBar steps={["Select Format", "Enter Topic", "Preview & Edit"]} current={aiStep === "type" ? 0 : aiStep === "prompt" ? 1 : 2} />

      {aiStep === "type" && (
        <FormatSelector
          onSelect={(fmt) => {
            setAiPostType(fmt === "carousel" ? "carousel" : "problem_solution");
            setAiStep("prompt");
          }}
        />
      )}

      {aiStep === "prompt" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What do you want to post about?</CardTitle>
            <CardDescription>Format: {aiPostType === "carousel" ? "Carousel" : "Single Page"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic / Main Idea</Label>
              <Input
                id="topic"
                placeholder="e.g., How AI is transforming software development workflows..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="context">Additional Context <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="context"
                placeholder="Any specific points, data, personal experience, or angle you want to include..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={4}
              />
            </div>

            {aiPostType === "carousel" && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-slide-count">Number of Slides</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="ai-slide-count"
                    type="range"
                    min={3}
                    max={15}
                    value={aiSlideCount}
                    onChange={(e) => setAiSlideCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-center text-sm font-semibold bg-primary/10 text-primary rounded-lg py-1">
                    {aiSlideCount} slides
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Drag to set how many carousel slides to generate (3–15)</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setAiStep("type")} disabled={generating || reviewing}>Back</Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={!topic.trim() || generating || reviewing}
              >
                {generating ? "Generating..." : "Generate & Preview"}
              </Button>
              <Button
                onClick={handleGenerateAndReview}
                disabled={!topic.trim() || generating || reviewing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {reviewing ? "Generating..." : "Generate & Send to Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {aiStep === "preview" && generatedContent && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review & Edit</CardTitle>
              <CardDescription>Edit the AI-generated content before saving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ai-title">Internal Title</Label>
                <Input id="ai-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-content">Post Content</Label>
                <Textarea
                  id="ai-content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm resize-y"
                />
              </div>

              {aiPostType === "carousel" && Array.isArray((generatedContent as Record<string, unknown[]>).slides) && (
                <div className="space-y-2">
                  <Label>Carousel Slides</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {((generatedContent as Record<string, unknown[]>).slides as Array<{ slideNumber: number; headline: string; bodyText: string }>).map((slide, i) => (
                      <Card key={i} className="p-3">
                        <p className="text-xs text-muted-foreground">Slide {slide.slideNumber || i + 1}</p>
                        <p className="font-semibold text-sm">{slide.headline}</p>
                        <p className="text-xs text-muted-foreground mt-1">{slide.bodyText}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray((generatedContent as Record<string, unknown>).hashtags) && (
                <div className="flex gap-2 flex-wrap">
                  {((generatedContent as Record<string, unknown>).hashtags as string[]).map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-md">
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setAiStep("prompt")} disabled={saving || reviewing}>Back</Button>
            <Button variant="outline" onClick={handleGenerate} disabled={generating || saving || reviewing}>
              {generating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAiSave(false)}
              disabled={saving || reviewing || !editedContent.trim()}
            >
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleAiSave(true)}
              disabled={saving || reviewing || !editedContent.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {reviewing ? "Submitting..." : "Send to Review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
