"use strict";
"use client";

import { useState } from "react";
import { ProjectTask, TaskStatus, TaskPriority } from "@/lib/api";
import { ChevronRight, ChevronDown, Circle, CheckCircle2, Diamond, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface WBSTreeViewProps {
    tasks: ProjectTask[];
    onTaskClick: (task: ProjectTask) => void;
    onAddTask: (parentId?: string) => void;
}

type RecursiveTask = ProjectTask & { subtasks?: RecursiveTask[] };

// Recursive Tree Node Component
const TreeNode = ({
    task,
    level,
    onTaskClick,
    onAddTask
}: {
    task: RecursiveTask;
    level: number;
    onTaskClick: (task: ProjectTask) => void;
    onAddTask: (parentId?: string) => void;
}) => {
    const [expanded, setExpanded] = useState(true);
    const subtasks = task.subtasks || [];
    const hasChildren = subtasks.length > 0;

    // Status Colors
    const statusColor = {
        Todo: "text-slate-500",
        InProgress: "text-blue-500",
        InReview: "text-amber-500",
        Done: "text-emerald-500",
        Cancelled: "text-gray-400"
    }[task.status] || "text-slate-500";

    return (
        <div className="select-none">
            {/* Task Row */}
            <div
                className={`flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-lg group transition-colors border-l-2 ${level > 0 ? "border-muted ml-4" : "border-transparent"}`}
            >
                {/* Expand Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className={`p-0.5 rounded-md hover:bg-muted text-muted-foreground transition-transform ${hasChildren ? "opacity-100" : "opacity-0"}`}
                >
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Status/Milestone Icon */}
                <div className={`flex-shrink-0 ${statusColor}`}>
                    {task.isMilestone ? (
                        <Diamond className="w-5 h-5 fill-current" />
                    ) : task.status === "Done" ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <Circle className="w-5 h-5" />
                    )}
                </div>

                {/* Content */}
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                >
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${task.status === "Done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                        </span>
                        {task.priority === "Urgent" && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium dark:bg-red-900/30 dark:text-red-400">
                                Urgent
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(task.id)} title="Add Subtask">
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTaskClick(task)} title="Edit">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div className="ml-2 border-l border-border/40 pl-0">
                    {subtasks.map(sub => (
                        <TreeNode
                            key={sub.id}
                            task={sub}
                            level={level + 1}
                            onTaskClick={onTaskClick}
                            onAddTask={onAddTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function WBSTreeView({ tasks, onTaskClick, onAddTask }: WBSTreeViewProps) {
    // 1. Build Hierarchy
    // 1. Build Hierarchy
    const buildTree = (taskList: ProjectTask[]) => {
        // Extend ProjectTask type to include 'subtasks' for the tree structure
        type TreeNode = ProjectTask & { subtasks: ProjectTask[] };
        const map = new Map<string, any>();
        const roots: any[] = [];

        // Initialize map
        taskList.forEach(t => {
            map.set(t.id, { ...t, subtasks: [] });
        });

        // Link parent-child
        taskList.forEach(t => {
            if (t.parentId && map.has(t.parentId)) {
                map.get(t.parentId)?.subtasks.push(map.get(t.id)!);
            } else {
                roots.push(map.get(t.id)!);
            }
        });

        return roots;
    };

    const tree = buildTree(tasks);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No tasks yet. Start planning your WBS!</p>
                <Button variant="outline" className="mt-4" onClick={() => onAddTask()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Root Task
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-1">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Work Breakdown Structure</h3>
                <Button size="sm" onClick={() => onAddTask()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                {/* Provide root nodes */}
                {tree.map(node => (
                    <TreeNode
                        key={node.id}
                        task={node}
                        level={0}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                    />
                ))}
            </div>
        </div>
    );
}
