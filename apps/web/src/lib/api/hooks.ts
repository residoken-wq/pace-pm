"use client";

import { useState, useEffect, useCallback } from "react";
import { api, Project, ProjectTask, TaskStatus, Member, AddMemberRequest, Workload, Attachment } from "./client";
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
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchProjects = useCallback(async () => {
        if (!workspaceId || authLoading) return;

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
    }, [workspaceId, authLoading]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchProjects();
        } else if (!authLoading && !isAuthenticated) {
            // Stop loading if not authenticated
            setLoading(false);
        }
    }, [fetchProjects, authLoading, isAuthenticated]);

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
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchTasks = useCallback(async () => {
        if (!projectId || authLoading) return;

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
    }, [projectId, authLoading]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchTasks();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [fetchTasks, authLoading, isAuthenticated]);

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

    const syncToTodo = useCallback(async (id: string) => {
        return api.syncTaskToTodo(id);
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
        syncToTodo,
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

// Members hook
export function useMembers(workspaceId: string) {
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchMembers = useCallback(async () => {
        if (!workspaceId || authLoading) return;
        try {
            setLoading(true);
            const data = await api.getMembers(workspaceId);
            setMembers(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch members"));
        } finally {
            setLoading(false);
        }
    }, [workspaceId, authLoading]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchMembers();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [fetchMembers, authLoading, isAuthenticated]);

    const addMember = useCallback(async (data: AddMemberRequest) => {
        const created = await api.addMember(data);
        setMembers((prev) => [...prev, created]);
        return created;
    }, []);

    const updateRole = useCallback(async (userId: string, role: string) => {
        await api.updateMemberRole(userId, workspaceId, role);
        setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: role as Member["role"] } : m)));
    }, [workspaceId]);

    const removeMember = useCallback(async (userId: string) => {
        await api.removeMember(userId, workspaceId);
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
    }, [workspaceId]);

    return {
        members,
        loading,
        error,
        refetch: fetchMembers,
        addMember,
        updateRole,
        removeMember,
    };
}

// Workload hook
export function useWorkload(workspaceId: string) {
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const [workload, setWorkload] = useState<Workload[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useApiAuth();

    const fetchWorkload = useCallback(async () => {
        if (!workspaceId || authLoading) return;
        try {
            setLoading(true);
            const data = await api.getWorkload(workspaceId);
            setWorkload(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch workload"));
        } finally {
            setLoading(false);
        }
    }, [workspaceId, authLoading]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchWorkload();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [fetchWorkload, authLoading, isAuthenticated]);

    return {
        workload,
        loading,
        error,
        refetch: fetchWorkload,
    };
}

// Attachments hook
export function useAttachments(taskId: string) {
    const { isLoading: authLoading, isAuthenticated } = useAuth();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [uploading, setUploading] = useState(false);

    useApiAuth();

    const fetchAttachments = useCallback(async () => {
        if (!taskId || authLoading) return;
        try {
            setLoading(true);
            const data = await api.getAttachments(taskId);
            setAttachments(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch attachments"));
        } finally {
            setLoading(false);
        }
    }, [taskId, authLoading]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchAttachments();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [fetchAttachments, authLoading, isAuthenticated]);

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const uploaded = await api.uploadFile(taskId, file);
            setAttachments((prev) => [uploaded, ...prev]);
            return uploaded;
        } finally {
            setUploading(false);
        }
    }, [taskId]);

    const deleteAttachment = useCallback(async (id: string) => {
        await api.deleteAttachment(id);
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const getDownloadUrl = useCallback((id: string) => {
        return api.getDownloadUrl(id);
    }, []);

    return {
        attachments,
        loading,
        uploading,
        error,
        refetch: fetchAttachments,
        uploadFile,
        deleteAttachment,
        getDownloadUrl,
    };
}
