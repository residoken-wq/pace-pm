namespace NexusProjectHub.API.Services;

public interface IProjectService
{
    Task<IEnumerable<Models.Project>> GetProjectsAsync(string workspaceId);
    Task<Models.Project?> GetProjectByIdAsync(string id);
    Task<Models.Project> CreateProjectAsync(Models.Project project);
    Task<Models.Project> UpdateProjectAsync(Models.Project project);
    Task DeleteProjectAsync(string id);
}

public interface ITaskService
{
    Task<IEnumerable<Models.ProjectTask>> GetTasksAsync(string projectId);
    Task<Models.ProjectTask?> GetTaskByIdAsync(string id);
    Task<Models.ProjectTask> CreateTaskAsync(Models.ProjectTask task);
    Task<Models.ProjectTask> UpdateTaskAsync(Models.ProjectTask task);
    Task DeleteTaskAsync(string id);
    Task<Models.ProjectTask> UpdateStatusAsync(string id, Models.TaskStatus status);
}

public interface IMicrosoftGraphService
{
    Task<Models.User> GetOrCreateUserAsync(string accessToken);
    Task SendTeamsNotificationAsync(string channelId, string message);
    Task<string> CreateCalendarEventAsync(string userId, Models.ProjectTask task);
    Task<string> CreateTodoTaskAsync(string userId, Models.ProjectTask task);
    Task<string> UploadToOneDriveAsync(string userId, string fileName, Stream fileStream);
    Task<byte[]> DownloadFileFromOneDriveAsync(string userId, string fileId);
    Task DeleteFileFromOneDriveAsync(string userId, string fileId);
}
