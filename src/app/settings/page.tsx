"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure your social media agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI Configuration</CardTitle>
          <CardDescription>API key and model settings for AI generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input
              type="password"
              value={settings.openai_api_key || ""}
              onChange={(e) => update("openai_api_key", e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Optional. If set here, it overrides the environment variable.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Default Model</Label>
            <Select value={settings.default_model || "gpt-4o"} onValueChange={(v) => update("default_model", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
          <CardDescription>Define your brand voice for consistent content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input
              value={settings.brand_name || ""}
              onChange={(e) => update("brand_name", e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand Voice Description</Label>
            <Textarea
              value={settings.brand_voice || ""}
              onChange={(e) => update("brand_voice", e.target.value)}
              rows={4}
              placeholder="Describe your brand's tone, style, and values..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Goals</CardTitle>
          <CardDescription>Set your content targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Posts Per Week Target</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.posts_per_week_target || "5"}
              onChange={(e) => update("posts_per_week_target", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
