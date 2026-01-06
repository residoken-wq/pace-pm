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

// Column config - brand accent colors
const columns = [
    { id: "todo", title: "To Do", color: "bg-gray-400", bgColor: "bg-gray-50 dark:bg-[#111d32]", apiStatus: "Todo" as ApiTaskStatus },
    { id: "in_progress", title: "In Progress", color: "bg-[#0047af]", bgColor: "bg-blue-50/50 dark:bg-[#0047af]/10", apiStatus: "InProgress" as ApiTaskStatus },
    { id: "in_review", title: "In Review", color: "bg-[#ffc942]", bgColor: "bg-yellow-50/50 dark:bg-[#ffc942]/10", apiStatus: "InReview" as ApiTaskStatus },
    { id: "done", title: "Done", color: "bg-[#10b981]", bgColor: "bg-green-50/50 dark:bg-green-900/10", apiStatus: "Done" as ApiTaskStatus },
];

// Priority badge colors - brand aligned
const priorityColors: Record<ApiPriority, string> = {
    Low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    Medium: "bg-[#59cbe8]/20 text-[#0047af] dark:bg-[#59cbe8]/10 dark:text-[#59cbe8]",
    High: "bg-[#ffc942]/20 text-[#f99a18] dark:bg-[#ffc942]/10 dark:text-[#ffc942]",
    Urgent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
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
            className="bg-white dark:bg-[#1a2744] rounded-xl p-3.5 shadow-sm border border-gray-200 dark:border-[#2a4066] cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#59cbe8]/50 transition-all"
        >
            <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {task.assignee && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.displayName}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a4066] transition-colors"
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
    return (
        <div
            className="flex-shrink-0 w-80"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.apiStatus)}
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${column.color} shadow-sm`} />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{column.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-[#1a2744] px-2.5 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(column.apiStatus)}
                    className="text-gray-400 hover:text-[#0047af] p-1.5 hover:bg-[#0047af]/10 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className={`space-y-2.5 min-h-[250px] ${column.bgColor} rounded-xl p-3 border border-gray-200/50 dark:border-[#1e3050]`}>
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={onDragStart}
                        onClick={onTaskClick}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a2744] flex items-center justify-center mb-2">
                            <Plus className="w-5 h-5" />
                        </div>
                        <p className="text-sm">Drop tasks here</p>
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
