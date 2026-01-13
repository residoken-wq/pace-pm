// API Configuration - NEXT_PUBLIC_API_URL should be base URL like https://pmapp.pace.edu.vn/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
    type: TaskType;
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
    isMilestone?: boolean;
    checklistItems?: ChecklistItem[];
    createdAt: string;
    updatedAt: string;
}

export type TaskStatus = "Todo" | "InProgress" | "InReview" | "Done" | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskType = "RoadmapPhase" | "Milestone" | "Task" | "Subtask";

export interface ChecklistItem {
    id: string;
    title: string;
    isCompleted: boolean;
    sortOrder: number;
    taskId: string;
    createdAt: string;
}

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
        return this.request<Project[]>(`/projects?workspaceId=${workspaceId}`);
    }

    async getProject(id: string): Promise<Project> {
        return this.request<Project>(`/projects/${id}`);
    }

    async createProject(project: Partial<Project>): Promise<Project> {
        return this.request<Project>("/projects", {
            method: "POST",
            body: JSON.stringify(project),
        });
    }

    async updateProject(id: string, project: Partial<Project>): Promise<Project> {
        return this.request<Project>(`/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(project),
        });
    }

    async deleteProject(id: string): Promise<void> {
        return this.request<void>(`/projects/${id}`, {
            method: "DELETE",
        });
    }

    // Tasks
    async getTasks(projectId: string): Promise<ProjectTask[]> {
        return this.request<ProjectTask[]>(`/tasks?projectId=${projectId}`);
    }

    async getTask(id: string): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/tasks/${id}`);
    }

    async createTask(task: Partial<ProjectTask>): Promise<ProjectTask> {
        return this.request<ProjectTask>("/tasks", {
            method: "POST",
            body: JSON.stringify(task),
        });
    }

    async updateTask(id: string, task: Partial<ProjectTask>): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(task),
        });
    }

    async updateTaskStatus(id: string, status: TaskStatus): Promise<ProjectTask> {
        return this.request<ProjectTask>(`/tasks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    }

    async deleteTask(id: string): Promise<void> {
        return this.request<void>(`/tasks/${id}`, {
            method: "DELETE",
        });
    }

    async syncTaskToCalendar(id: string): Promise<{ eventId: string }> {
        return this.request<{ eventId: string }>(`/tasks/${id}/sync-calendar`, {
            method: "POST",
        });
    }

    async syncTaskToTodo(id: string): Promise<{ todoId: string }> {
        return this.request<{ todoId: string }>(`/tasks/${id}/sync-todo`, {
            method: "POST",
        });
    }

    // Checklist Items
    async getChecklistItems(taskId: string): Promise<ChecklistItem[]> {
        return this.request<ChecklistItem[]>(`/tasks/${taskId}/checklist`);
    }

    async addChecklistItem(taskId: string, title: string): Promise<ChecklistItem> {
        return this.request<ChecklistItem>(`/tasks/${taskId}/checklist`, {
            method: "POST",
            body: JSON.stringify({ title }),
        });
    }

    async updateChecklistItem(taskId: string, itemId: string, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
        return this.request<ChecklistItem>(`/tasks/${taskId}/checklist/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    async deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
        return this.request<void>(`/tasks/${taskId}/checklist/${itemId}`, {
            method: "DELETE",
        });
    }

    // Members
    async getMembers(workspaceId: string): Promise<Member[]> {
        return this.request<Member[]>(`/members?workspaceId=${workspaceId}`);
    }

    async getAllUsers(): Promise<User[]> {
        return this.request<User[]>("/members/users");
    }

    async addMember(data: AddMemberRequest): Promise<Member> {
        return this.request<Member>("/members", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateMemberRole(userId: string, workspaceId: string, role: string): Promise<void> {
        return this.request<void>(`/members/${userId}/role`, {
            method: "PUT",
            body: JSON.stringify({ workspaceId, role }),
        });
    }

    async removeMember(userId: string, workspaceId: string): Promise<void> {
        return this.request<void>(`/members/${userId}?workspaceId=${workspaceId}`, {
            method: "DELETE",
        });
    }

    async getWorkload(workspaceId: string): Promise<Workload[]> {
        return this.request<Workload[]>(`/members/workload?workspaceId=${workspaceId}`);
    }

    // Files
    async getAttachments(taskId: string): Promise<Attachment[]> {
        return this.request<Attachment[]>(`/files?taskId=${taskId}`);
    }

    async uploadFile(taskId: string, file: File): Promise<Attachment> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("taskId", taskId);

        const headers: Record<string, string> = {};
        if (this.getToken) {
            const token = await this.getToken();
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        }

        const response = await fetch(`${this.baseUrl}/files/upload`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${error}`);
        }

        return response.json();
    }

    async deleteAttachment(id: string): Promise<void> {
        return this.request<void>(`/files/${id}`, { method: "DELETE" });
    }

    getDownloadUrl(id: string): string {
        return `${this.baseUrl}/files/download/${id}`;
    }

    // Health check
    async health(): Promise<{ status: string }> {
        return this.request<{ status: string }>("/health");
    }
}

// Member types
export interface Member {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    jobTitle?: string;
    department?: string;
    role: WorkspaceRole;
    joinedAt: string;
}

export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Viewer";

export interface AddMemberRequest {
    workspaceId: string;
    email: string;
    displayName?: string;
    microsoftId?: string;
    role?: WorkspaceRole;
}

export interface Workload {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    overdueTasks: number;
}

// File types
export interface Attachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType?: string;
    createdAt: string;
}

// Singleton instance
export const api = new ApiClient(API_BASE_URL);

