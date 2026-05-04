"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/lib/types";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  lead: "bg-amber-100 text-amber-700",
  member: "bg-blue-100 text-blue-700",
  designer: "bg-purple-100 text-purple-700",
};

const authRoleColors: Record<string, string> = {
  employee: "bg-muted text-muted-foreground",
  admin: "bg-blue-100 text-blue-700",
  designer: "bg-purple-100 text-purple-700",
  superadmin: "bg-red-100 text-red-700",
};

const authRoleLabels: Record<string, string> = {
  employee: "Employee",
  admin: "Admin",
  designer: "Designer",
  superadmin: "Super Admin",
};

export default function TeamPage() {
  const { authRole } = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member",
    auth_role: "employee",
    password: "",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = () => {
    fetch("/api/team").then((r) => r.json()).then(setMembers);
  };

  const handleAdd = async () => {
    if (!form.name || !form.password) {
      toast.error("Name and password are required");
      return;
    }
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add member");
        return;
      }
      toast.success("Team member added!");
      setDialogOpen(false);
      setForm({ name: "", email: "", role: "member", auth_role: "employee", password: "" });
      fetchMembers();
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this team member?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    toast.success("Member removed");
    fetchMembers();
  };

  const handleAuthRoleChange = async (id: number, newAuthRole: string) => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_role: newAuthRole }),
      });
      if (!res.ok) {
        toast.error("Failed to update role");
        return;
      }
      toast.success("Access role updated");
      fetchMembers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const canManage = authRole === "admin" || authRole === "superadmin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="text-muted-foreground">{members.length} members</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Set a login password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Access Role</Label>
                  <Select value={form.auth_role} onValueChange={(v) => setForm({ ...form, auth_role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {authRole === "superadmin" && <SelectItem value="superadmin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={!form.name || !form.password}>Add Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Role</TableHead>
                <TableHead>Access Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[member.role] || ""}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        value={member.auth_role}
                        onValueChange={(v) => handleAuthRoleChange(member.id, v)}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {authRole === "superadmin" && (
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className={authRoleColors[member.auth_role] || ""}>
                        {authRoleLabels[member.auth_role] || member.auth_role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>Remove</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
