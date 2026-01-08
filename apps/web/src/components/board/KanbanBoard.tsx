"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { Plus, MoreHorizontal, GripVertical, X, Calendar, User } from "lucide-react";
import { useTasksByStatus, TaskStatus as ApiTaskStatus, TaskPriority as ApiPriority, ProjectTask } from "@/lib/api";

// Column configuration with semantic colors
const columns = [
    {
        id: "todo",
        title: "To Do",
        color: "bg-slate-400",
        bgColor: "bg-muted/50",
        apiStatus: "Todo" as ApiTaskStatus
    },
    {
        id: "in_progress",
        title: "In Progress",
        color: "bg-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        apiStatus: "InProgress" as ApiTaskStatus
    },
    {
        id: "in_review",
        title: "In Review",
        color: "bg-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        apiStatus: "InReview" as ApiTaskStatus
    },
    {
        id: "done",
        title: "Done",
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        apiStatus: "Done" as ApiTaskStatus
    },
];

// Priority styling
const priorityStyles: Record<ApiPriority, string> = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
    Urgent: "priority-urgent",
};

interface TaskCardProps {
    task: ProjectTask;
    onDragStart: (e: React.DragEvent, task: ProjectTask) => void;
    onClick: (task: ProjectTask) => void;
}

function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onClick(task)}
            className="bg-card rounded-xl p-4 shadow-soft border border-border cursor-grab active:cursor-grabbing hover:shadow-soft-lg hover:border-primary/30 transition-all group"
        >
            <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug">
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}
                            </span>
                        )}
                        {task.assignee && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.displayName}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

interface KanbanColumnProps {
    column: typeof columns[0];
    tasks: ProjectTask[];
    onDragStart: (e: React.DragEvent, task: ProjectTask) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: ApiTaskStatus) => void;
    onAddTask: (status: ApiTaskStatus) => void;
    onTaskClick: (task: ProjectTask) => void;
}

function KanbanColumn({ column, tasks, onDragStart, onDragOver, onDrop, onAddTask, onTaskClick }: KanbanColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            className="flex-shrink-0 w-80"
            onDragOver={(e) => {
                onDragOver(e);
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                onDrop(e, column.apiStatus);
                setIsDragOver(false);
            }}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(column.apiStatus)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title={`Add task to ${column.title}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Column Body */}
            <div
                className={`space-y-3 min-h-[300px] ${column.bgColor} rounded-xl p-3 border border-border/50 transition-colors ${isDragOver ? 'border-primary/50 bg-primary/5' : ''
                    }`}
            >
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={onDragStart}
                        onClick={onTaskClick}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                            <Plus className="w-5 h-5" />
                        </div>
                        <p className="text-sm">Drop tasks here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Task Modal
interface TaskModalProps {
    isOpen: boolean;
    task?: ProjectTask | null;
    defaultStatus?: ApiTaskStatus;
    onClose: () => void;
    onSave: (task: Partial<ProjectTask>) => void;
}

function TaskModal({ isOpen, task, defaultStatus, onClose, onSave }: TaskModalProps) {
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [priority, setPriority] = useState<ApiPriority>(task?.priority || "Medium");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setPriority(task.priority);
        } else {
            setTitle("");
            setDescription("");
            setPriority("Medium");
        }
    }, [task]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...(task ? { id: task.id } : {}),
                title,
                description,
                priority,
                status: task?.status || defaultStatus || "Todo",
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
                    <h2 className="text-lg font-semibold">{task ? "Edit Task" : "New Task"}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Title <span className="text-destructive">*</span>
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
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
                            placeholder="Task description..."
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <div className="flex gap-2">
                            {(["Low", "Medium", "High", "Urgent"] as ApiPriority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${priority === p
                                            ? priorityStyles[p] + ' ring-2 ring-ring ring-offset-2'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-11" disabled={saving || !title.trim()}>
                            {task ? "Save Changes" : "Create Task"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface KanbanBoardProps {
    projectId: string;
    openModalTrigger?: number;
}

export function KanbanBoard({ projectId, openModalTrigger }: KanbanBoardProps) {
    const { tasksByStatus, loading, error, createTask, updateTask, updateStatus } = useTasksByStatus(projectId);

    const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
    const [defaultStatus, setDefaultStatus] = useState<ApiTaskStatus>("Todo");

    // Open modal when trigger changes (from parent)
    useEffect(() => {
        if (openModalTrigger && openModalTrigger > 0) {
            setSelectedTask(null);
            setDefaultStatus("Todo");
            setModalOpen(true);
        }
    }, [openModalTrigger]);

    const handleDragStart = useCallback((e: React.DragEvent, task: ProjectTask) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, newStatus: ApiTaskStatus) => {
        e.preventDefault();
        if (!draggedTask || draggedTask.status === newStatus) return;

        try {
            await updateStatus(draggedTask.id, newStatus);
        } catch (err) {
            console.error("Failed to update status:", err);
        }

        setDraggedTask(null);
    }, [draggedTask, updateStatus]);

    const handleAddTask = useCallback((status: ApiTaskStatus) => {
        setSelectedTask(null);
        setDefaultStatus(status);
        setModalOpen(true);
    }, []);

    const handleTaskClick = useCallback((task: ProjectTask) => {
        setSelectedTask(task);
        setModalOpen(true);
    }, []);

    const handleSaveTask = useCallback(async (taskData: Partial<ProjectTask>) => {
        try {
            if (taskData.id) {
                await updateTask(taskData.id, taskData);
            } else {
                await createTask(taskData);
            }
        } catch (err) {
            console.error("Failed to save task:", err);
        }
    }, [createTask, updateTask]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
                <p className="font-medium mb-1">Failed to load tasks</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-5 min-w-max">
                    {columns.map((column) => {
                        const columnTasks = tasksByStatus[column.apiStatus as keyof typeof tasksByStatus] || [];
                        return (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                tasks={columnTasks}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onAddTask={handleAddTask}
                                onTaskClick={handleTaskClick}
                            />
                        );
                    })}
                </div>
            </div>

            <TaskModal
                isOpen={modalOpen}
                task={selectedTask}
                defaultStatus={defaultStatus}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTask}
            />
        </>
    );
}
