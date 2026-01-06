// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types matching backend models
export interface User {
    id: string;
    microsoftId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    jobTitle?: string;
    department?: string;
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    teamsTeamId?: string;
    teamsChannelId?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string;
    targetDate?: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
}

export type ProjectStatus = "Planning" | "Active" | "OnHold" | "Completed" | "Archived";

export interface ProjectTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    sortOrder: number;
    projectId: string;
    assigneeId?: string;
    assignee?: User;
    creatorId: string;
    creator?: User;
    parentId?: string;
    outlookEventId?: string;
    todoTaskId?: string;
    createdAt: string;
    updatedAt: string;
}

export type TaskStatus = "Todo" | "InProgress" | "InReview" | "Done" | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

// API Client class
class ApiClient {
    private baseUrl: string;
    private getToken: (() => Promise<string | null>) | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setTokenProvider(provider: () => Promise<string | null>) {
        this.getToken = provider;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        // Add auth token if available
        if (this.getToken) {
            const token = await this.getToken();
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        // Handle empty response
        const text = await response.text();
        if (!text) return {} as T;

        return JSON.parse(text) as T;
    }

    // Projects
    async getProjects(workspaceId: string): Promise<Project[]> {
        return this.request<Project[]>(`/api/projects?workspaceId=${workspaceId}`);
    }

    async getProject(id: string): Promise<Project> {
        return this.request<Project>(`/api/projects/${id}`);
    }

    async createProject(project: Partial<Project>): Promise<Project> {
        return this.request<Project>("/api/projects", {
            method: "POST",
            body: JSON.stringify(project),
        });
    }

    async updateProject(id: string, project: Partial<Project>): Promise<Project> {
        return this.request<Project>(`/api/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(project),
        });
    }

    async deleteProject(id: string): Promise<void> {
        return this.request<void>(`/api/projects/${id}`, {
            method: "DELETE",
        });
    }

    // Tasks
    async getTasks(projectId: string): Promise<ProjectTask[]> {
        return this.request<ProjectTask[]>(`/api/tasks?projectId=${projectId}`);
    }

    async getTask(id: string): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/api/tasks/${id}`);
    }

    async createTask(task: Partial<ProjectTask>): Promise<ProjectTask> {
        return this.request<ProjectTask>("/api/tasks", {
            method: "POST",
            body: JSON.stringify(task),
        });
    }

    async updateTask(id: string, task: Partial<ProjectTask>): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/api/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(task),
        });
    }

    async updateTaskStatus(id: string, status: TaskStatus): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/api/tasks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    }

    async deleteTask(id: string): Promise<void> {
        return this.request<void>(`/api/tasks/${id}`, {
            method: "DELETE",
        });
    }

    async syncTaskToCalendar(id: string): Promise<{ eventId: string }> {
        return this.request<{ eventId: string }>(`/api/tasks/${id}/sync-calendar`, {
            method: "POST",
        });
    }

    // Health check
    async health(): Promise<{ status: string }> {
        return this.request<{ status: string }>("/health");
    }
}

// Singleton instance
export const api = new ApiClient(API_BASE_URL);
