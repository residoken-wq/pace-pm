"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { Plus, MoreHorizontal, GripVertical, X, Calendar, User, Flag } from "lucide-react";
import { useTasksByStatus, TaskStatus as ApiTaskStatus, TaskPriority as ApiPriority, ProjectTask } from "@/lib/api";

// Map API status to UI status
const statusMap: Record<string, ApiTaskStatus> = {
    todo: "Todo",
    in_progress: "InProgress",
    in_review: "InReview",
    done: "Done",
};

const reverseStatusMap: Record<ApiTaskStatus, string> = {
    Todo: "todo",
    InProgress: "in_progress",
    InReview: "in_review",
    Done: "done",
    Cancelled: "cancelled",
};

// Column config
const columns = [
    { id: "todo", title: "To Do", color: "bg-slate-500", apiStatus: "Todo" as ApiTaskStatus },
    { id: "in_progress", title: "In Progress", color: "bg-blue-500", apiStatus: "InProgress" as ApiTaskStatus },
    { id: "in_review", title: "In Review", color: "bg-yellow-500", apiStatus: "InReview" as ApiTaskStatus },
    { id: "done", title: "Done", color: "bg-green-500", apiStatus: "Done" as ApiTaskStatus },
];

// Priority badge colors
const priorityColors: Record<ApiPriority, string> = {
    Low: "bg-slate-100 text-slate-700",
    Medium: "bg-blue-100 text-blue-700",
    High: "bg-orange-100 text-orange-700",
    Urgent: "bg-red-100 text-red-700",
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
            className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        >
            <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {task.assignee && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.displayName}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-slate-400 hover:text-slate-600"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div >
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
    return (
        <div
            className="flex-shrink-0 w-72"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.apiStatus)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.title}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(column.apiStatus)}
                    className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="space-y-2 min-h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={onDragStart}
                        onClick={onTaskClick}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}

// Task Modal for creating/editing
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...(task ? { id: task.id } : {}),
            title,
            description,
            priority,
            status: task?.status || defaultStatus || "Todo",
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold">{task ? "Edit Task" : "New Task"}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
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
                            placeholder="Task description..."
                            rows={3}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            {(["Low", "Medium", "High", "Urgent"] as ApiPriority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1 rounded-full text-sm ${priority === p
                                        ? priorityColors[p]
                                        : "bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {task ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface KanbanBoardProps {
    projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
    const { tasksByStatus, loading, error, createTask, updateTask, updateStatus } = useTasksByStatus(projectId);

    const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
    const [defaultStatus, setDefaultStatus] = useState<ApiTaskStatus>("Todo");

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
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                Error loading tasks: {error.message}
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
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
