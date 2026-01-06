"use client";

import { useState, useEffect, useCallback } from "react";
import { api, Project, ProjectTask, TaskStatus } from "./client";
import { useAuth } from "@/lib/auth";

// Hook to set auth token provider
export function useApiAuth() {
    const { getAccessToken } = useAuth();

    useEffect(() => {
        api.setTokenProvider(getAccessToken);
    }, [getAccessToken]);
}

// Projects hook
export function useProjects(workspaceId: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchProjects = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setLoading(true);
            const data = await api.getProjects(workspaceId);
            setProjects(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch projects"));
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = useCallback(async (project: Partial<Project>) => {
        const created = await api.createProject({ ...project, workspaceId });
        setProjects((prev) => [...prev, created]);
        return created;
    }, [workspaceId]);

    const updateProject = useCallback(async (id: string, project: Partial<Project>) => {
        const updated = await api.updateProject(id, project);
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        await api.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}

// Tasks hook
export function useTasks(projectId: string) {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchTasks = useCallback(async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            const data = await api.getTasks(projectId);
            setTasks(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch tasks"));
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = useCallback(async (task: Partial<ProjectTask>) => {
        const created = await api.createTask({ ...task, projectId });
        setTasks((prev) => [...prev, created]);
        return created;
    }, [projectId]);

    const updateTask = useCallback(async (id: string, task: Partial<ProjectTask>) => {
        const updated = await api.updateTask(id, task);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const updateStatus = useCallback(async (id: string, status: TaskStatus) => {
        const updated = await api.updateTaskStatus(id, status);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const deleteTask = useCallback(async (id: string) => {
        await api.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const syncToCalendar = useCallback(async (id: string) => {
        return api.syncTaskToCalendar(id);
    }, []);

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        updateStatus,
        deleteTask,
        syncToCalendar,
    };
}

// Group tasks by status for Kanban
export function useTasksByStatus(projectId: string) {
    const { tasks, loading, error, ...rest } = useTasks(projectId);

    const tasksByStatus = {
        Todo: tasks.filter((t) => t.status === "Todo"),
        InProgress: tasks.filter((t) => t.status === "InProgress"),
        InReview: tasks.filter((t) => t.status === "InReview"),
        Done: tasks.filter((t) => t.status === "Done"),
    };

    return {
        tasks,
        tasksByStatus,
        loading,
        error,
        ...rest,
    };
}
