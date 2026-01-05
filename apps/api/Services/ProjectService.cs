using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;

    public ProjectService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Project>> GetProjectsAsync(string workspaceId)
    {
        return await _db.Projects
            .Where(p => p.WorkspaceId == workspaceId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Project?> GetProjectByIdAsync(string id)
    {
        return await _db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Project> CreateProjectAsync(Project project)
    {
        project.Id = Guid.NewGuid().ToString();
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        
        return project;
    }

    public async Task<Project> UpdateProjectAsync(Project project)
    {
        project.UpdatedAt = DateTime.UtcNow;
        _db.Projects.Update(project);
        await _db.SaveChangesAsync();
        
        return project;
    }

    public async Task DeleteProjectAsync(string id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project != null)
        {
            _db.Projects.Remove(project);
            await _db.SaveChangesAsync();
        }
    }
}

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ProjectTask>> GetTasksAsync(string projectId)
    {
        return await _db.Tasks
            .Where(t => t.ProjectId == projectId && t.ParentId == null)
            .Include(t => t.Assignee)
            .Include(t => t.Subtasks)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();
    }

    public async Task<ProjectTask?> GetTaskByIdAsync(string id)
    {
        return await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Creator)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.Attachments)
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<ProjectTask> CreateTaskAsync(ProjectTask task)
    {
        task.Id = Guid.NewGuid().ToString();
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        
        return task;
    }

    public async Task<ProjectTask> UpdateTaskAsync(ProjectTask task)
    {
        task.UpdatedAt = DateTime.UtcNow;
        _db.Tasks.Update(task);
        await _db.SaveChangesAsync();
        
        return task;
    }

    public async Task DeleteTaskAsync(string id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task != null)
        {
            _db.Tasks.Remove(task);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<ProjectTask> UpdateStatusAsync(string id, Models.TaskStatus status)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task == null) throw new KeyNotFoundException($"Task {id} not found");
        
        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        
        return task;
    }
}
