"use client";

import { useAuth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import { useProjects, Project, useApiAuth, api } from "@/lib/api";
import {
    Folder,
    Plus,
    Settings,
    Users,
    LayoutGrid,
    BarChart3,
    LogOut,
    ChevronDown,
    Search,
    Bell,
    X,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

// Default workspace ID (in real app, this would come from user selection)
const DEFAULT_WORKSPACE_ID = "default";

// Project colors
const projectColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
];

interface ProjectModalProps {
    isOpen: boolean;
    project?: Project | null;
    onClose: () => void;
    onSave: (project: Partial<Project>) => void;
}

function ProjectModal({ isOpen, project, onClose, onSave }: ProjectModalProps) {
    const [name, setName] = useState(project?.name || "");
    const [description, setDescription] = useState(project?.description || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
        } else {
            setName("");
            setDescription("");
        }
    }, [project]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...(project ? { id: project.id } : {}),
                name,
                description,
                status: project?.status || "Planning",
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold">{project ? "Edit Project" : "New Project"}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Project Name *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Project description..."
                            rows={3}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={saving || !name.trim()}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (project ? "Update" : "Create")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function BoardPage() {
    const { account, logout, isLoading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, createProject, updateProject } = useProjects(DEFAULT_WORKSPACE_ID);

    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [taskModalTrigger, setTaskModalTrigger] = useState(0);

    // Set first project as active when projects load
    useEffect(() => {
        if (projects.length > 0 && !activeProject) {
            setActiveProject(projects[0]);
        }
    }, [projects, activeProject]);

    // Initialize API auth
    useApiAuth();

    const handleCreateProject = useCallback(() => {
        setEditingProject(null);
        setProjectModalOpen(true);
    }, []);

    const handleNewTask = useCallback(() => {
        // Trigger KanbanBoard to open task modal
        setTaskModalTrigger(prev => prev + 1);
    }, []);

    const handleSaveProject = useCallback(async (projectData: Partial<Project>) => {
        try {
            if (projectData.id) {
                await updateProject(projectData.id, projectData);
            } else {
                const created = await createProject(projectData);
                setActiveProject(created);
            }
        } catch (err) {
            console.error("Failed to save project:", err);
        }
    }, [createProject, updateProject]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!account) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Please sign in</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/">
                            <Button>Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        {sidebarOpen && <span className="font-semibold text-slate-800 dark:text-white">Nexus</span>}
                    </Link>
                </div>

                {/* Projects */}
                <div className="flex-1 overflow-y-auto p-3">
                    {sidebarOpen && (
                        <div className="text-xs font-medium text-slate-500 uppercase mb-2">Projects</div>
                    )}

                    {projectsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {projects.map((project, index) => (
                                <button
                                    key={project.id}
                                    onClick={() => setActiveProject(project)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeProject?.id === project.id
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${projectColors[index % projectColors.length]}`} />
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1 text-left truncate">{project.name}</span>
                                        </>
                                    )}
                                </button>
                            ))}

                            {projects.length === 0 && sidebarOpen && (
                                <p className="text-sm text-slate-400 text-center py-4">
                                    No projects yet
                                </p>
                            )}
                        </div>
                    )}

                    {sidebarOpen && (
                        <button
                            onClick={handleCreateProject}
                            className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Project</span>
                        </button>
                    )}
                </div>

                {/* User */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {account.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{account.name}</p>
                                <p className="text-xs text-slate-500 truncate">{account.username}</p>
                            </div>
                        )}
                        <button onClick={logout} className="text-slate-400 hover:text-red-500">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        {activeProject ? (
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${projectColors[projects.indexOf(activeProject) % projectColors.length]}`} />
                                <h1 className="font-semibold text-slate-800 dark:text-white">{activeProject.name}</h1>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                        ) : (
                            <h1 className="font-semibold text-slate-800 dark:text-white">Select a Project</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-64 h-8 pl-9 pr-3 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <button className="relative text-slate-500 hover:text-slate-700">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <Button
                            size="sm"
                            className="gap-1"
                            onClick={handleNewTask}
                            disabled={!activeProject}
                        >
                            <Plus className="w-4 h-4" />
                            New Task
                        </Button>
                    </div>
                </header>

                {/* Board Tabs */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4">
                    <div className="flex gap-4">
                        <button className="py-3 px-1 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                            Board
                        </button>
                        <button className="py-3 px-1 text-sm font-medium text-slate-500 hover:text-slate-700">
                            Timeline
                        </button>
                        <button className="py-3 px-1 text-sm font-medium text-slate-500 hover:text-slate-700">
                            Table
                        </button>
                        <button className="py-3 px-1 text-sm font-medium text-slate-500 hover:text-slate-700">
                            Calendar
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-auto p-6">
                    {activeProject ? (
                        <KanbanBoard projectId={activeProject.id} openModalTrigger={taskModalTrigger} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Folder className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">No project selected</p>
                            <p className="text-sm">Create a new project or select one from the sidebar</p>
                            <Button onClick={handleCreateProject} className="mt-4 gap-2">
                                <Plus className="w-4 h-4" />
                                Create Project
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            {/* Project Modal */}
            <ProjectModal
                isOpen={projectModalOpen}
                project={editingProject}
                onClose={() => setProjectModalOpen(false)}
                onSave={handleSaveProject}
            />
        </div>
    );
}
