"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { Plus, MoreHorizontal, GripVertical, X, Calendar, User, Trash2, AlertTriangle, Loader2, Diamond } from "lucide-react";
import { useTasksByStatus, TaskStatus as ApiTaskStatus, TaskPriority as ApiPriority, ProjectTask } from "@/lib/api";

// Column configuration with semantic colors
const columns = [
    { id: "todo", title: "To Do", color: "bg-slate-400", bgColor: "bg-muted/50", apiStatus: "Todo" as ApiTaskStatus },
    { id: "in_progress", title: "In Progress", color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", apiStatus: "InProgress" as ApiTaskStatus },
    { id: "in_review", title: "In Review", color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", apiStatus: "InReview" as ApiTaskStatus },
    { id: "done", title: "Done", color: "bg-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", apiStatus: "Done" as ApiTaskStatus },
];

// Status config for display
const statusConfig: Record<ApiTaskStatus, { label: string; color: string }> = {
    Todo: { label: "To Do", color: "bg-slate-400" },
    InProgress: { label: "In Progress", color: "bg-blue-500" },
    InReview: { label: "In Review", color: "bg-amber-500" },
    Done: { label: "Done", color: "bg-emerald-500" },
    Cancelled: { label: "Cancelled", color: "bg-gray-400" },
};

// Priority styling (same classes as globals.css)
const priorityStyles: Record<ApiPriority, string> = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
    Urgent: "priority-urgent",
};

// ============================================
// Task Card
// ============================================
interface TaskCardProps {
    task: ProjectTask;
    onDragStart: (e: React.DragEvent, task: ProjectTask) => void;
    onClick: (task: ProjectTask) => void;
}

function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Done";

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
                    <p className="font-medium text-sm leading-snug">{task.title}</p>
                    {task.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}
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
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ============================================
// Kanban Column
// ============================================
interface KanbanColumnProps {
    column: (typeof columns)[0];
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
            onDragOver={(e) => { onDragOver(e); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { onDrop(e, column.apiStatus); setIsDragOver(false); }}
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
                </div>
                <button onClick={() => onAddTask(column.apiStatus)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={`Add task to ${column.title}`}>
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className={`space-y-3 min-h-[300px] ${column.bgColor} rounded-xl p-3 border border-border/50 transition-colors ${isDragOver ? "border-primary/50 bg-primary/5" : ""}`}>
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onDragStart={onDragStart} onClick={onTaskClick} />
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

// ============================================
// Task Modal (Enhanced)
// ============================================
export interface TaskModalProps {
    isOpen: boolean;
    task?: ProjectTask | null;
    defaultStatus?: ApiTaskStatus;
    potentialParents?: ProjectTask[];
    onClose: () => void;
    onSave: (task: Partial<ProjectTask>) => void;
    onDelete?: (taskId: string) => void;
    onSyncToCalendar?: (taskId: string) => Promise<any>;
    onSyncToTodo?: (taskId: string) => Promise<any>;
}

export function TaskModal({ isOpen, task, defaultStatus, potentialParents = [], onClose, onSave, onDelete, onSyncToCalendar, onSyncToTodo }: TaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<ApiPriority>("Medium");
    const [status, setStatus] = useState<ApiTaskStatus>("Todo");
    const [dueDate, setDueDate] = useState("");
    const [parentId, setParentId] = useState<string>("");
    const [isMilestone, setIsMilestone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState<"calendar" | "todo" | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
            setParentId(task.parentId || "");
            setIsMilestone(task.isMilestone || false);
        } else {
            setTitle("");
            setDescription("");
            setPriority("Medium");
            setStatus(defaultStatus || "Todo");
            setDueDate("");
            setParentId("");
            setIsMilestone(false);
        }
        setShowDeleteConfirm(false);
    }, [task, defaultStatus, isOpen]);

    if (!isOpen) return null;

    // Filter out self and potentially children to prevent simple cycles
    const validParents = potentialParents.filter(p => !task || p.id !== task.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...(task ? { id: task.id } : {}),
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                parentId: parentId || null, // Ensure empty string becomes null
                isMilestone,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onDelete) return;
        setSaving(true);
        try {
            await onDelete(task.id);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async (type: "calendar" | "todo") => {
        if (!task || (type === "calendar" && !onSyncToCalendar) || (type === "todo" && !onSyncToTodo)) return;
        setSyncing(type);
        try {
            if (type === "calendar" && onSyncToCalendar) await onSyncToCalendar(task.id);
            if (type === "todo" && onSyncToTodo) await onSyncToTodo(task.id);
        } finally {
            setSyncing(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 flex-shrink-0">
                    <h2 className="text-lg font-semibold">{task ? "Edit Task" : "New Task"}</h2>
                    <div className="flex items-center gap-1">
                        {task && onDelete && (
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete task">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto">
                    {showDeleteConfirm ? (
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-destructive" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Delete Task?</h3>
                            <p className="text-muted-foreground text-sm mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-10" disabled={saving}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete} className="flex-1 h-10" disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Title <span className="text-destructive">*</span></label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." className="h-11" required autoFocus />
                            </div>

                            {/* Description */}
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

                            {/* Status (for edit mode) */}
                            {task && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(["Todo", "InProgress", "InReview", "Done"] as ApiTaskStatus[]).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setStatus(s)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${statusConfig[s].color}`} />
                                                {statusConfig[s].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Priority & Due Date Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Priority</label>
                                    <div className="flex gap-1">
                                        {(["Low", "Medium", "High", "Urgent"] as ApiPriority[]).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPriority(p)}
                                                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${priority === p ? priorityStyles[p] + " ring-2 ring-ring ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Due Date</label>
                                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
                                </div>
                            </div>

                            {/* Parent Task Selector */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Parent Task</label>
                                <select
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">(No Parent)</option>
                                    {validParents.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Microsoft 365 Sync */}
                            {task && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Microsoft 365 Sync</label>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={() => handleSync("calendar")}
                                            disabled={syncing !== null || !dueDate}
                                            title={!dueDate ? "Set due date to sync" : "Sync to Outlook Calendar"}
                                        >
                                            {syncing === "calendar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4 text-blue-500" />}
                                            Add to Calendar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={() => handleSync("todo")}
                                            disabled={syncing !== null}
                                            title="Sync to Microsoft To-Do"
                                        >
                                            {syncing === "todo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded border-2 border-primary" />}
                                            Add to To-Do
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Milestone Toggle */}
                            <div className="flex items-center gap-2 pb-2">
                                <label className="text-sm font-medium">Task Type</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isMilestone"
                                        checked={isMilestone}
                                        onChange={(e) => setIsMilestone(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="isMilestone" className="text-sm text-foreground flex items-center gap-1 cursor-pointer select-none">
                                        <Diamond className={`w-4 h-4 ${isMilestone ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                                        Mark as Milestone
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
                                <Button type="submit" className="flex-1 h-11" disabled={saving || !title.trim()}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : task ? "Save Changes" : "Create Task"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div >
    );
}

// ============================================
// Main KanbanBoard
// ============================================
interface KanbanBoardProps {
    projectId: string;
    openModalTrigger?: number;
}

export function KanbanBoard({ projectId, openModalTrigger }: KanbanBoardProps) {
    const { tasks, tasksByStatus, loading, error, createTask, updateTask, updateStatus, deleteTask, syncToCalendar, syncToTodo } = useTasksByStatus(projectId);

    const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
    const [defaultStatus, setDefaultStatus] = useState<ApiTaskStatus>("Todo");

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

    const handleDeleteTask = useCallback(async (taskId: string) => {
        try {
            await deleteTask(taskId);
        } catch (err) {
            console.error("Failed to delete task:", err);
        }
    }, [deleteTask]);

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
                potentialParents={tasks}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                onSyncToCalendar={syncToCalendar}
                onSyncToTodo={syncToTodo}
            />
        </>
    );
}
