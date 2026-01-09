"use client";

import { useAuth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board";
import { TeamPanel } from "@/components/team";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import { useProjects, Project, useApiAuth } from "@/lib/api";
import {
    Folder,
    Plus,
    LayoutGrid,
    LogOut,
    ChevronDown,
    Search,
    Bell,
    X,
    Loader2,
    Home,
    Moon,
    Sun,
    MoreVertical,
    Edit2,
    Trash2,
    AlertTriangle,
    Users
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULT_WORKSPACE_ID = "default";

// Project status config
const projectStatusConfig: Record<string, { label: string; color: string }> = {
    Planning: { label: "Planning", color: "bg-slate-400" },
    Active: { label: "Active", color: "bg-blue-500" },
    OnHold: { label: "On Hold", color: "bg-amber-500" },
    Completed: { label: "Completed", color: "bg-emerald-500" },
    Archived: { label: "Archived", color: "bg-gray-400" },
};

// Project dot colors
const projectDotColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
];

// ============================================
// Project Modal (Create/Edit)
// ============================================
interface ProjectModalProps {
    isOpen: boolean;
    project?: Project | null;
    onClose: () => void;
    onSave: (project: Partial<Project>) => void;
}

function ProjectModal({ isOpen, project, onClose, onSave }: ProjectModalProps) {
    const [name, setName] = useState(project?.name || "");
    const [description, setDescription] = useState(project?.description || "");
    const [status, setStatus] = useState(project?.status || "Active");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
            setStatus(project.status || "Active");
        } else {
            setName("");
            setDescription("");
            setStatus("Active");
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...(project ? { id: project.id } : {}),
                name,
                description,
                status: status as Project["status"],
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold">{project ? "Edit Project" : "New Project"}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Project Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name..."
                            className="h-11"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>
                    {project && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(projectStatusConfig).map(([key, { label, color }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setStatus(key as any)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${status === key
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${color}`} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-11" disabled={saving || !name.trim()}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : project ? "Save Changes" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// Delete Confirmation Modal
// ============================================
interface DeleteModalProps {
    isOpen: boolean;
    projectName: string;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}

function DeleteModal({ isOpen, projectName, onClose, onConfirm, deleting }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        Are you sure you want to delete <strong>{projectName}</strong>? This action cannot be undone and all tasks will be deleted.
                    </p>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10" disabled={deleting}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={onConfirm} className="flex-1 h-10" disabled={deleting}>
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Project Context Menu
// ============================================
interface ProjectMenuProps {
    project: Project;
    onEdit: () => void;
    onDelete: () => void;
}

function ProjectMenu({ project, onEdit, onDelete }: ProjectMenuProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================
// Theme Toggle
// ============================================
function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}

// ============================================
// Main Board Page
// ============================================
export default function BoardPage() {
    const { account, logout, isLoading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects(DEFAULT_WORKSPACE_ID);

    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [taskModalTrigger, setTaskModalTrigger] = useState(0);
    const [teamPanelOpen, setTeamPanelOpen] = useState(false);

    useEffect(() => {
        if (projects.length > 0 && !activeProject) {
            setActiveProject(projects[0]);
        }
    }, [projects, activeProject]);

    useApiAuth();

    const handleCreateProject = useCallback(() => {
        setEditingProject(null);
        setProjectModalOpen(true);
    }, []);

    const handleEditProject = useCallback((project: Project) => {
        setEditingProject(project);
        setProjectModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((project: Project) => {
        setDeletingProject(project);
        setDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingProject) return;
        setDeleting(true);
        try {
            await deleteProject(deletingProject.id);
            if (activeProject?.id === deletingProject.id) {
                setActiveProject(projects.find(p => p.id !== deletingProject.id) || null);
            }
            setDeleteModalOpen(false);
            setDeletingProject(null);
        } catch (err) {
            console.error("Failed to delete project:", err);
        } finally {
            setDeleting(false);
        }
    }, [deletingProject, deleteProject, activeProject, projects]);

    const handleNewTask = useCallback(() => {
        setTaskModalTrigger(prev => prev + 1);
    }, []);

    const handleSaveProject = useCallback(async (projectData: Partial<Project>) => {
        try {
            if (projectData.id) {
                const updated = await updateProject(projectData.id, projectData);
                if (activeProject?.id === projectData.id) {
                    setActiveProject(updated);
                }
            } else {
                const created = await createProject(projectData);
                setActiveProject(created);
            }
        } catch (err) {
            console.error("Failed to save project:", err);
        }
    }, [createProject, updateProject, activeProject]);

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading Nexus...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!account) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-sm w-full shadow-soft-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">N</span>
                        </div>
                        <CardTitle className="text-xl">Welcome to Nexus</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">Sign in to access your projects</p>
                        <Link href="/">
                            <Button className="w-full h-11">Sign In with Microsoft</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* ===== Sidebar ===== */}
            <aside className={`${sidebarOpen ? "w-64" : "w-20"} flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300`}>
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-border">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        {sidebarOpen && <span className="font-semibold text-lg">Nexus</span>}
                    </Link>
                </div>

                {/* Nav */}
                <nav className="p-3 space-y-1">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Home className="w-5 h-5" />
                        {sidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
                    </Link>
                </nav>

                {/* Projects */}
                <div className="flex-1 overflow-y-auto px-3">
                    {sidebarOpen && (
                        <div className="flex items-center justify-between mb-2 px-3 pt-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                            <button onClick={handleCreateProject} className="p-1 rounded text-primary hover:bg-primary/10 transition-colors" title="New Project">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {projectsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-1 pb-3">
                            {projects.map((project, index) => (
                                <div key={project.id} className="group relative">
                                    <button
                                        onClick={() => setActiveProject(project)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeProject?.id === project.id
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${projectDotColors[index % projectDotColors.length]}`} />
                                        {sidebarOpen && (
                                            <>
                                                <span className="flex-1 text-left truncate">{project.name}</span>
                                                <div className={`w-1.5 h-1.5 rounded-full ${projectStatusConfig[project.status]?.color || "bg-gray-400"}`} title={project.status} />
                                            </>
                                        )}
                                    </button>
                                    {sidebarOpen && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <ProjectMenu
                                                project={project}
                                                onEdit={() => handleEditProject(project)}
                                                onDelete={() => handleDeleteClick(project)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {projects.length === 0 && sidebarOpen && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                                        <Folder className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
                                    <Button size="sm" onClick={handleCreateProject}>
                                        <Plus className="w-4 h-4 mr-1" /> New Project
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User */}
                <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {account.name?.charAt(0) || "U"}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{account.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{account.username}</p>
                            </div>
                        )}
                        <button onClick={logout} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Sign out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ===== Main Content ===== */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        {activeProject ? (
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${projectDotColors[projects.indexOf(activeProject) % projectDotColors.length]}`} />
                                <h1 className="font-semibold text-lg">{activeProject.name}</h1>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${projectStatusConfig[activeProject.status]?.color} text-white`}>
                                    {projectStatusConfig[activeProject.status]?.label}
                                </span>
                                <button
                                    onClick={() => handleEditProject(activeProject)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                                    title="Edit project"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <h1 className="font-semibold text-lg">Select a Project</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-56 h-10 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                            />
                        </div>
                        <ThemeToggle />
                        <button
                            onClick={() => setTeamPanelOpen(true)}
                            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Team"
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <button className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                        </button>
                        <Button onClick={handleNewTask} disabled={!activeProject} className="h-10 px-4 ml-1">
                            <Plus className="w-4 h-4 mr-1.5" />
                            New Task
                        </Button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="h-12 bg-card border-b border-border px-6 flex items-center gap-1">
                    <button className="h-full px-4 text-sm font-medium text-primary border-b-2 border-primary">Board</button>
                    {/* Placeholder for future views
                    <button className="h-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Timeline</button>
                    <button className="h-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Table</button>
                    <button className="h-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Calendar</button>
                    */}
                </div>

                {/* Board Area */}
                <div className="flex-1 overflow-auto p-6 bg-muted/30">
                    {activeProject ? (
                        <KanbanBoard projectId={activeProject.id} openModalTrigger={taskModalTrigger} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-20 h-20 rounded-2xl bg-card shadow-soft-lg flex items-center justify-center mb-5">
                                <Folder className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">No project selected</h2>
                            <p className="text-muted-foreground mb-6">Create or select a project to get started</p>
                            <Button onClick={handleCreateProject} size="lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <ProjectModal
                isOpen={projectModalOpen}
                project={editingProject}
                onClose={() => setProjectModalOpen(false)}
                onSave={handleSaveProject}
            />
            <DeleteModal
                isOpen={deleteModalOpen}
                projectName={deletingProject?.name || ""}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                deleting={deleting}
            />

            {/* Team Panel */}
            <TeamPanel
                workspaceId={DEFAULT_WORKSPACE_ID}
                isOpen={teamPanelOpen}
                onClose={() => setTeamPanelOpen(false)}
            />
        </div>
    );
}
