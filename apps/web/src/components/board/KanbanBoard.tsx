"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";

// Types
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: "low" | "medium" | "high" | "urgent";
    assignee?: { name: string; avatar?: string };
    dueDate?: string;
    order: number;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export interface Column {
    id: TaskStatus;
    title: string;
    color: string;
    tasks: Task[];
}

// Initial columns
const defaultColumns: Column[] = [
    { id: "todo", title: "To Do", color: "bg-slate-500", tasks: [] },
    { id: "in_progress", title: "In Progress", color: "bg-blue-500", tasks: [] },
    { id: "in_review", title: "In Review", color: "bg-yellow-500", tasks: [] },
    { id: "done", title: "Done", color: "bg-green-500", tasks: [] },
];

// Sample tasks
const sampleTasks: Task[] = [
    { id: "1", title: "Setup database schema", status: "done", priority: "high", order: 0 },
    { id: "2", title: "Implement user authentication", status: "done", priority: "high", order: 1 },
    { id: "3", title: "Build Smart Board UI", status: "in_progress", priority: "high", order: 0 },
    { id: "4", title: "Connect Frontend to API", status: "todo", priority: "medium", order: 0 },
    { id: "5", title: "Add Teams integration", status: "todo", priority: "medium", order: 1 },
    { id: "6", title: "Implement drag and drop", status: "in_review", priority: "high", order: 0 },
];

// Priority badge colors
const priorityColors = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
};

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, task: Task) => void;
}

function TaskCard({ task, onDragStart }: TaskCardProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
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
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-xs text-slate-500">{task.dueDate}</span>
                        )}
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

interface KanbanColumnProps {
    column: Column;
    onDragStart: (e: React.DragEvent, task: Task) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: TaskStatus) => void;
    onAddTask: (status: TaskStatus) => void;
}

function KanbanColumn({ column, onDragStart, onDragOver, onDrop, onAddTask }: KanbanColumnProps) {
    return (
        <div
            className="flex-shrink-0 w-72"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.title}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {column.tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(column.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="space-y-2 min-h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                {column.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
                ))}
                {column.tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}

export function KanbanBoard() {
    const [columns, setColumns] = useState<Column[]>(() => {
        // Initialize columns with sample tasks
        return defaultColumns.map((col) => ({
            ...col,
            tasks: sampleTasks.filter((t) => t.status === col.id).sort((a, b) => a.order - b.order),
        }));
    });

    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();
        if (!draggedTask) return;

        setColumns((prevColumns) => {
            return prevColumns.map((col) => {
                // Remove from old column
                if (col.id === draggedTask.status) {
                    return {
                        ...col,
                        tasks: col.tasks.filter((t) => t.id !== draggedTask.id),
                    };
                }
                // Add to new column
                if (col.id === newStatus) {
                    const updatedTask = { ...draggedTask, status: newStatus };
                    return {
                        ...col,
                        tasks: [...col.tasks, updatedTask],
                    };
                }
                return col;
            });
        });

        setDraggedTask(null);
    }, [draggedTask]);

    const handleAddTask = useCallback((status: TaskStatus) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title: "New Task",
            status,
            priority: "medium",
            order: 0,
        };

        setColumns((prevColumns) =>
            prevColumns.map((col) =>
                col.id === status ? { ...col, tasks: [...col.tasks, newTask] } : col
            )
        );
    }, []);

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onAddTask={handleAddTask}
                    />
                ))}
            </div>
        </div>
    );
}
