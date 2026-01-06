"use client";

import { useAuth } from "@/lib/auth";
import { KanbanBoard } from "@/components/board";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
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
    Bell
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Sample projects
const projects = [
    { id: "1", name: "Nexus Project Hub", color: "bg-blue-500", tasksCount: 12 },
    { id: "2", name: "SOC Dashboard", color: "bg-green-500", tasksCount: 8 },
    { id: "3", name: "Mini Shop App", color: "bg-purple-500", tasksCount: 5 },
];

export default function BoardPage() {
    const { account, logout, isLoading } = useAuth();
    const [activeProject, setActiveProject] = useState(projects[0]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
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
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        {sidebarOpen && <span className="font-semibold text-slate-800 dark:text-white">Nexus</span>}
                    </div>
                </div>

                {/* Projects */}
                <div className="flex-1 overflow-y-auto p-3">
                    {sidebarOpen && (
                        <div className="text-xs font-medium text-slate-500 uppercase mb-2">Projects</div>
                    )}
                    <div className="space-y-1">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => setActiveProject(project)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeProject.id === project.id
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${project.color}`} />
                                {sidebarOpen && (
                                    <>
                                        <span className="flex-1 text-left truncate">{project.name}</span>
                                        <span className="text-xs text-slate-400">{project.tasksCount}</span>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    {sidebarOpen && (
                        <button className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
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
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${activeProject.color}`} />
                            <h1 className="font-semibold text-slate-800 dark:text-white">{activeProject.name}</h1>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
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
                        <Button size="sm" className="gap-1">
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
                    <KanbanBoard />
                </div>
            </main>
        </div>
    );
}
