"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@/components/ui";
import { useMembers, useWorkload, Member, AddMemberRequest, Workload } from "@/lib/api";
import {
    Users,
    UserPlus,
    X,
    MoreVertical,
    Shield,
    ShieldCheck,
    Eye,
    Trash2,
    Loader2,
    AlertTriangle,
    BarChart3
} from "lucide-react";

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    Owner: { label: "Owner", icon: ShieldCheck, color: "text-amber-500" },
    Admin: { label: "Admin", icon: Shield, color: "text-blue-500" },
    Member: { label: "Member", icon: Users, color: "text-emerald-500" },
    Viewer: { label: "Viewer", icon: Eye, color: "text-slate-400" },
};

// ============================================
// Member Card
// ============================================
interface MemberCardProps {
    member: Member;
    canManage: boolean;
    onChangeRole: (userId: string, role: string) => void;
    onRemove: (userId: string) => void;
}

function MemberCard({ member, canManage, onChangeRole, onRemove }: MemberCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const RoleIcon = roleConfig[member.role]?.icon || Users;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-soft transition-all group">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-medium flex-shrink-0">
                {member.displayName?.charAt(0) || member.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{member.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${roleConfig[member.role]?.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{member.role}</span>
            </div>
            {canManage && member.role !== "Owner" && (
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                            {["Admin", "Member", "Viewer"].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => { onChangeRole(member.userId, role); setMenuOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${member.role === role ? "bg-muted" : ""}`}
                                >
                                    Set as {role}
                                </button>
                            ))}
                            <hr className="my-1 border-border" />
                            <button
                                onClick={() => { onRemove(member.userId); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Remove
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// Workload Bar
// ============================================
function WorkloadBar({ workload }: { workload: Workload }) {
    const total = workload.todoTasks + workload.inProgressTasks + workload.doneTasks;
    const donePercent = total > 0 ? (workload.doneTasks / total) * 100 : 0;
    const inProgressPercent = total > 0 ? (workload.inProgressTasks / total) * 100 : 0;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {workload.displayName?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{workload.displayName}</p>
                    <span className="text-xs text-muted-foreground">{workload.totalTasks} tasks</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500" style={{ width: `${donePercent}%` }} />
                    <div className="bg-blue-500" style={{ width: `${inProgressPercent}%` }} />
                </div>
                {workload.overdueTasks > 0 && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {workload.overdueTasks} overdue
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================
// Add Member Modal
// ============================================
interface AddMemberModalProps {
    isOpen: boolean;
    workspaceId: string;
    onClose: () => void;
    onAdd: (data: AddMemberRequest) => void;
}

function AddMemberModal({ isOpen, workspaceId, onClose, onAdd }: AddMemberModalProps) {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<string>("Member");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail("");
            setDisplayName("");
            setRole("Member");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onAdd({ workspaceId, email, displayName: displayName || undefined, role: role as any });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold">Add Team Member</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email <span className="text-destructive">*</span></label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" type="email" className="h-11" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Display Name</label>
                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Doe" className="h-11" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Role</label>
                        <div className="flex gap-2">
                            {["Admin", "Member", "Viewer"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${role === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
                        <Button type="submit" className="flex-1 h-11" disabled={saving || !email.trim()}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// Team Panel (Main Component)
// ============================================
interface TeamPanelProps {
    workspaceId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function TeamPanel({ workspaceId, isOpen, onClose }: TeamPanelProps) {
    const { members, loading, addMember, updateRole, removeMember } = useMembers(workspaceId);
    const { workload, loading: workloadLoading } = useWorkload(workspaceId);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"members" | "workload">("members");

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

            {/* Panel Slide-in */}
            <div className="fixed right-0 top-0 h-full w-96 max-w-full z-50 bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Team</h2>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{members.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setAddModalOpen(true)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Add member">
                            <UserPlus className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "members" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Users className="w-4 h-4 inline mr-1.5" /> Members
                    </button>
                    <button
                        onClick={() => setActiveTab("workload")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "workload" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-1.5" /> Workload
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "members" ? (
                        loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground mb-4">No team members yet</p>
                                <Button onClick={() => setAddModalOpen(true)} size="sm">
                                    <UserPlus className="w-4 h-4 mr-1.5" /> Add First Member
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <MemberCard
                                        key={member.userId}
                                        member={member}
                                        canManage={true} // TODO: check current user role
                                        onChangeRole={updateRole}
                                        onRemove={removeMember}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        workloadLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : workload.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No workload data</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {workload.map((w) => (
                                    <WorkloadBar key={w.userId} workload={w} />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Add Member Modal */}
            <AddMemberModal
                isOpen={addModalOpen}
                workspaceId={workspaceId}
                onClose={() => setAddModalOpen(false)}
                onAdd={addMember}
            />
        </>
    );
}
