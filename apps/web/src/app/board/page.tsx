"use client";

import { useAuth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board";
import { TeamPanel } from "@/components/team";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import { useProjects, Project, useApiAuth } from "@/lib/api";
import {
    Plus,
    LayoutGrid,
    LogOut,
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
    Users,
    Folder,
    Menu,
    ChevronRight,
    Settings
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { WBSTreeView } from "@/components/board/WBSTreeView";
import { useTasksByStatus, ProjectTask } from "@/lib/api";
import { TaskModal } from "@/components/board/KanbanBoard";
import { ProjectSidebar, SidebarView } from "@/components/layout/ProjectSidebar";

// ============================================
// WBS Container
// ============================================
function WBSContainer({ projectId, activeProject }: { projectId: string, activeProject: any }) {
    const { tasks, tasksByStatus, loading, createTask, updateTask, deleteTask } = useTasksByStatus(projectId);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
    const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);

    // Flatten tasks from status columns to single list for WBS
    const allTasks = tasks; // hooks now return flat list too

    const handleAddTask = (parentId?: string) => {
        setSelectedTask(null);
        setParentTaskId(parentId);
        setModalOpen(true);
    };

    const handleTaskClick = (task: ProjectTask) => {
        setSelectedTask(task);
        setParentTaskId(undefined);
        setModalOpen(true);
    };

    const handleSaveTask = async (taskData: Partial<ProjectTask>) => {
        try {
            if (taskData.id) {
                await updateTask(taskData.id, taskData);
            } else {
                await createTask({ ...taskData, parentId: parentTaskId, projectId });
            }
        } catch (err) {
            console.error("Failed to save task:", err);
        }
    };

    return (
        <>
            <WBSTreeView
                tasks={allTasks}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
            />
            <TaskModal
                isOpen={modalOpen}
                task={selectedTask}
                potentialParents={allTasks}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={(id) => deleteTask(id)}
            />
        </>
    );
}

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
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500",
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
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold">{project ? "Edit Project" : "New Project"}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">Project Name <span className="text-destructive">*</span></label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name..." className="h-11" required autoFocus />
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
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${status === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${color}`} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
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
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
                    <p className="text-muted-foreground text-sm mb-6">Are you sure you want to delete <strong>{projectName}</strong>? This action cannot be undone and all tasks will be deleted.</p>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10" disabled={deleting}>Cancel</Button>
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
// Global Sidebar Item
// ============================================
function GlobalSidebarItem({ icon: Icon, label, active, onClick, title }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-primary text-white shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            title={title || label}
        >
            <Icon className="w-5 h-5" />
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
    const [projectSidebarOpen, setProjectSidebarOpen] = useState(true);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [taskModalTrigger, setTaskModalTrigger] = useState(0);
    const [teamPanelOpen, setTeamPanelOpen] = useState(false);

    // View state
    const [view, setView] = useState<SidebarView>("work_packages"); // Default to WBS as "Work Packages"

    const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);

    useEffect(() => {
        if (projects.length > 0 && !activeProject) {
            setActiveProject(projects[0]);
        }
    }, [projects, activeProject]);

    useApiAuth();

    const handleCreateProject = useCallback(() => {
        setEditingProject(null);
        setProjectModalOpen(true);
        setIsProjectsMenuOpen(false);
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
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                        <Link href="/">
                            <Button className="w-full h-11">Sign In with Microsoft</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* ======================= */}
            {/* 1. Global Sidebar       */}
            {/* ======================= */}
            <aside className="w-16 flex-shrink-0 bg-card border-r border-border flex flex-col items-center py-4 z-20">
                {/* Logo */}
                <div className="mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft">
                        <span className="text-white font-bold text-lg">N</span>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col gap-3 w-full px-2">
                    <GlobalSidebarItem icon={Home} label="Home" onClick={() => { }} />

                    {/* Projects Drawer Trigger */}
                    <div className="relative group">
                        <GlobalSidebarItem
                            icon={Folder}
                            label="Projects"
                            active={isProjectsMenuOpen || !!activeProject}
                            onClick={() => setIsProjectsMenuOpen(!isProjectsMenuOpen)}
                        />
                        {/* Projects Popover */}
                        {isProjectsMenuOpen && (
                            <div className="absolute left-full top-0 ml-2 w-64 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-left-2">
                                <div className="flex items-center justify-between mb-2 px-2 pb-2 border-b border-border">
                                    <span className="font-semibold text-sm">Projects</span>
                                    <button onClick={handleCreateProject} className="p-1 rounded hover:bg-muted text-primary"><Plus className="w-4 h-4" /></button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto space-y-1">
                                    {projectsLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : projects.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setActiveProject(p); setIsProjectsMenuOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-muted transition-colors ${activeProject?.id === p.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${projectStatusConfig[p.status]?.color || "bg-gray-400"}`} />
                                            <span className="truncate">{p.name}</span>
                                        </button>
                                    ))}
                                    {projects.length === 0 && <span className="text-xs text-muted-foreground px-2">No projects</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <GlobalSidebarItem icon={Users} label="Team" onClick={() => setTeamPanelOpen(true)} />
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-3 w-full px-2">
                    <GlobalSidebarItem icon={Settings} label="Settings" onClick={() => { }} />
                    <button onClick={logout} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold overflow-hidden border border-border">
                        {account.name?.charAt(0)}
                    </div>
                </div>
            </aside>

            {/* ======================= */}
            {/* 2. Project Sidebar      */}
            {/* ======================= */}
            {activeProject && (
                <ProjectSidebar
                    isOpen={projectSidebarOpen}
                    projectName={activeProject.name}
                    activeView={view}
                    onViewChange={setView}
                    onToggle={() => setProjectSidebarOpen(!projectSidebarOpen)}
                />
            )}

            {/* ======================= */}
            {/* 3. Main Content         */}
            {/* ======================= */}
            <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
                {/* Expand sidebar button if closed */}
                {activeProject && !projectSidebarOpen && (
                    <button
                        onClick={() => setProjectSidebarOpen(true)}
                        className="absolute left-2 top-3 z-30 p-2 rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}

                {/* Header */}
                <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
                    <div className={`flex items-center gap-3 ${!projectSidebarOpen ? "pl-10" : ""}`}>
                        {activeProject ? (
                            <>
                                <h1 className="font-semibold text-lg">{activeProject.name}</h1>
                                <span className="text-muted-foreground text-sm">/</span>
                                <span className="font-medium text-sm text-primary capitalize">{view.replace("_", " ")}</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Select a project</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button size="sm" onClick={handleNewTask} disabled={!activeProject}>
                            <Plus className="w-4 h-4 mr-2" /> New Task
                        </Button>
                        <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-card" />
                        </button>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {activeProject ? (
                        <>
                            {view === "overview" && (
                                <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <LayoutGrid className="w-12 h-12 mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium">Project Overview</h3>
                                    <p>Dashboard and summary statistics (Coming Soon)</p>
                                </div>
                            )}
                            {view === "work_packages" && (
                                <div className="flex-1 overflow-auto bg-muted/20">
                                    <WBSContainer projectId={activeProject.id} activeProject={activeProject} />
                                </div>
                            )}
                            {view === "boards" && (
                                <div className="flex-1 overflow-auto p-6 bg-muted/20">
                                    <KanbanBoard projectId={activeProject.id} openModalTrigger={taskModalTrigger} />
                                </div>
                            )}
                            {(view === "activity" || view === "gantt" || view === "calendars" || view === "team_planners" || view === "meetings" || view === "news" || view === "team" || view === "settings") && (
                                <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                        <Settings className="w-6 h-6 opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium capitalize">{view.replace("_", " ")}</h3>
                                    <p>This module is under development.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Folder className="w-16 h-16 mb-4 opacity-20" />
                            <h2 className="text-xl font-semibold">No Project Selected</h2>
                            <p className="mt-2 text-center max-w-xs">Select a project from the sidebar or create a new one to get started.</p>
                            <Button onClick={handleCreateProject} className="mt-6">Create Project</Button>
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
            <TeamPanel
                workspaceId={DEFAULT_WORKSPACE_ID}
                isOpen={teamPanelOpen}
                onClose={() => setTeamPanelOpen(false)}
            />
        </div>
    );
}
