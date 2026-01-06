"use client";

import { useAuth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board";
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
    Home
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

const DEFAULT_WORKSPACE_ID = "default";

// Project colors - brand accent palette
const projectColors = [
    "bg-[#0047af]",
    "bg-[#59cbe8]",
    "bg-[#ffc942]",
    "bg-[#f99a18]",
    "bg-[#6ce0ff]",
    "bg-[#2885f1]",
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1a2744] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-[#2a4066]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2a4066]">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{project ? "Edit Project" : "New Project"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a4066] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name..."
                            className="w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the project..."
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 dark:border-[#2a4066] bg-white dark:bg-[#0f1a2e] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0047af] focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-11 bg-[#0047af] hover:bg-[#003d96]" disabled={saving || !name.trim()}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (project ? "Update" : "Create Project")}
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

    const handleNewTask = useCallback(() => {
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
            <div className="min-h-screen bg-gray-50 dark:bg-[#0c1525] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0047af]" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0c1525] flex items-center justify-center p-4">
                <Card className="max-w-sm w-full shadow-lg">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-[#0047af] flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold text-xl">N</span>
                        </div>
                        <CardTitle>Welcome to Nexus</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-500 mb-4">Please sign in to continue</p>
                        <Link href="/">
                            <Button className="w-full bg-[#0047af] hover:bg-[#003d96]">Sign In</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0c1525] flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#111d32] border-r border-gray-200 dark:border-[#1e3050] transition-all duration-300 flex flex-col shadow-sm`}>
                {/* Logo */}
                <div className="p-4 border-b border-gray-100 dark:border-[#1e3050]">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0047af] to-[#59cbe8] flex items-center justify-center shadow-lg shadow-[#0047af]/20">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        {sidebarOpen && <span className="font-semibold text-gray-900 dark:text-white text-lg">Nexus</span>}
                    </Link>
                </div>

                {/* Navigation */}
                <div className="p-3">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2744] transition-colors">
                        <Home className="w-5 h-5" />
                        {sidebarOpen && <span className="text-sm font-medium">Home</span>}
                    </Link>
                </div>

                {/* Projects */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {sidebarOpen && (
                        <div className="flex items-center justify-between mb-2 px-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</span>
                            <button
                                onClick={handleCreateProject}
                                className="text-[#0047af] hover:bg-[#0047af]/10 p-1 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {projectsLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-[#0047af]" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {projects.map((project, index) => (
                                <button
                                    key={project.id}
                                    onClick={() => setActiveProject(project)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeProject?.id === project.id
                                            ? 'bg-[#0047af]/10 text-[#0047af] dark:bg-[#0047af]/20 font-medium'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2744]'
                                        }`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${projectColors[index % projectColors.length]} shadow-sm`} />
                                    {sidebarOpen && (
                                        <span className="flex-1 text-left truncate">{project.name}</span>
                                    )}
                                </button>
                            ))}

                            {projects.length === 0 && sidebarOpen && (
                                <div className="text-center py-6 px-3">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1a2744] flex items-center justify-center mx-auto mb-3">
                                        <Folder className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">No projects yet</p>
                                    <Button size="sm" onClick={handleCreateProject} className="bg-[#0047af] hover:bg-[#003d96]">
                                        <Plus className="w-4 h-4 mr-1" /> Create
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User */}
                <div className="p-3 border-t border-gray-100 dark:border-[#1e3050]">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0047af] to-[#59cbe8] flex items-center justify-center text-white text-sm font-medium shadow-md">
                            {account.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{account.name}</p>
                                <p className="text-xs text-gray-500 truncate">{account.username}</p>
                            </div>
                        )}
                        <button onClick={logout} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2744] transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-[#111d32] border-b border-gray-200 dark:border-[#1e3050] flex items-center justify-between px-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2744] transition-colors"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        {activeProject ? (
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${projectColors[projects.indexOf(activeProject) % projectColors.length]} shadow-sm`} />
                                <h1 className="font-semibold text-gray-900 dark:text-white text-lg">{activeProject.name}</h1>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                        ) : (
                            <h1 className="font-semibold text-gray-900 dark:text-white text-lg">Select a Project</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-64 h-10 pl-10 pr-4 text-sm bg-gray-50 dark:bg-[#0c1525] border border-gray-200 dark:border-[#1e3050] rounded-xl focus:ring-2 focus:ring-[#0047af] focus:border-transparent focus:outline-none transition-all"
                            />
                        </div>
                        <button className="relative text-gray-500 hover:text-gray-700 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2744] transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ffc942] rounded-full border-2 border-white dark:border-[#111d32]" />
                        </button>
                        <Button
                            onClick={handleNewTask}
                            disabled={!activeProject}
                            className="h-10 px-4 bg-[#0047af] hover:bg-[#003d96] shadow-md shadow-[#0047af]/20"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            New Task
                        </Button>
                    </div>
                </header>

                {/* Board Tabs */}
                <div className="bg-white dark:bg-[#111d32] border-b border-gray-200 dark:border-[#1e3050] px-5">
                    <div className="flex gap-1">
                        <button className="py-3.5 px-4 text-sm font-medium text-[#0047af] border-b-2 border-[#0047af] transition-colors">
                            Board
                        </button>
                        <button className="py-3.5 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 transition-colors">
                            Timeline
                        </button>
                        <button className="py-3.5 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 transition-colors">
                            Table
                        </button>
                        <button className="py-3.5 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 transition-colors">
                            Calendar
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0c1525]">
                    {activeProject ? (
                        <KanbanBoard projectId={activeProject.id} openModalTrigger={taskModalTrigger} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#111d32] flex items-center justify-center mb-4 shadow-lg">
                                <Folder className="w-10 h-10 text-[#59cbe8]" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No project selected</h2>
                            <p className="text-gray-500 mb-6">Create a new project or select one from the sidebar</p>
                            <Button onClick={handleCreateProject} className="bg-[#0047af] hover:bg-[#003d96] shadow-lg shadow-[#0047af]/20">
                                <Plus className="w-4 h-4 mr-2" />
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
