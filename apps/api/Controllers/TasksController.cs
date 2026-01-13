using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;
using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Models;
using NexusProjectHub.API.Services;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IMicrosoftGraphService _graphService;
    private readonly NexusProjectHub.API.Data.AppDbContext _context;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        IMicrosoftGraphService graphService,
        NexusProjectHub.API.Data.AppDbContext context,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _graphService = graphService;
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectTask>>> GetTasks([FromQuery] string projectId)
    {
        if (string.IsNullOrEmpty(projectId))
            return BadRequest("projectId is required");

        var tasks = await _taskService.GetTasksAsync(projectId);
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectTask>> GetTask(string id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound();

        return Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectTask>> CreateTask([FromBody] CreateTaskRequest request)
    {
        // Resolve Creator from Token
        var userId = User.GetObjectId();
        if (string.IsNullOrEmpty(userId))
            userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                     ?? User.FindFirst("oid")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID not found in token");

        var creator = await _context.Users.FirstOrDefaultAsync(u => u.MicrosoftId == userId);
        
        // If user not found in DB (edge case: first API call before frontend sync), try to sync
        if (creator == null)
        {
             // We can't easily call GraphService.GetOrCreateUserAsync without a token here unless we use ITokenAcquisition.
             // But for now, let's assume if it fails, we return generic error or try to create a placeholder.
             // Actually, since this is a protected API, we trust the token. We can create a placeholder user.
             creator = new Models.User 
             { 
                 MicrosoftId = userId, 
                 Email = User.Identity?.Name ?? "unknown@example.com", 
                 DisplayName = User.FindFirst("name")?.Value ?? "Unknown User" 
             };
             _context.Users.Add(creator);
             await _context.SaveChangesAsync();
        }

        var task = new ProjectTask
        {
            Title = request.Title,
            Description = request.Description,
            ProjectId = request.ProjectId,
            AssigneeId = request.AssigneeId,
            CreatorId = creator.Id, // Use the internal DB ID
            Priority = request.Priority,
            DueDate = request.DueDate,
            ParentId = request.ParentId,
            Type = request.Type
        };

        var created = await _taskService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetTask), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectTask>> UpdateTask(string id, [FromBody] UpdateTaskRequest request)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound();

        task.Title = request.Title ?? task.Title;
        task.Description = request.Description ?? task.Description;
        task.Status = request.Status ?? task.Status;
        task.Priority = request.Priority ?? task.Priority;
        task.DueDate = request.DueDate ?? task.DueDate;
        task.AssigneeId = request.AssigneeId ?? task.AssigneeId;
        task.EstimatedHours = request.EstimatedHours ?? task.EstimatedHours;
        task.ActualHours = request.ActualHours ?? task.ActualHours;
        task.SortOrder = request.SortOrder ?? task.SortOrder;
        task.Type = request.Type ?? task.Type;

        var updated = await _taskService.UpdateTaskAsync(task);
        return Ok(updated);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ProjectTask>> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        try
        {
            var updated = await _taskService.UpdateStatusAsync(id, request.Status);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(string id)
    {
        await _taskService.DeleteTaskAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/sync-calendar")]
    public async Task<ActionResult> SyncToCalendar(string id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound("Task not found");

        if (task.DueDate == null)
            return BadRequest("Task must have a due date to sync to calendar");

        try 
        {
            // Use the current user's OID from the token
            var userId = User.GetObjectId(); 
            // Note: If GetObjectId() extension is missing, use User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            
            if (string.IsNullOrEmpty(userId))
                userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                         ?? User.FindFirst("oid")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token");
            
            // In a delegated flow (web api), the Graph Service will generally use 'Me' if we configure it right,
            // but our current implementation uses Users[id].
            // If the token is for 'Me', Users[my-id] also works.
            
            var eventId = await _graphService.CreateCalendarEventAsync(userId, task);
            
            // Allow re-sync: if checks exist we can update instead of create, but for now simple create
            task.OutlookEventId = eventId;
            await _taskService.UpdateTaskAsync(task);

            return Ok(new { eventId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync task {TaskId} to calendar", id);
            return StatusCode(500, "Failed to sync to calendar: " + ex.Message);
        }
    }

    [HttpPost("{id}/sync-todo")]
    public async Task<ActionResult> SyncToTodo(string id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound("Task not found");

        try 
        {
            var userId = User.GetObjectId();
            if (string.IsNullOrEmpty(userId))
                userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                         ?? User.FindFirst("oid")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token");
            
            var todoId = await _graphService.CreateTodoTaskAsync(userId, task);
            
            task.TodoTaskId = todoId;
            await _taskService.UpdateTaskAsync(task);

            return Ok(new { todoId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync task {TaskId} to To-Do", id);
            return StatusCode(500, "Failed to sync to To-Do: " + ex.Message);
        }
    }

    // ==========================================
    // CHECKLIST ENDPOINTS
    // ==========================================

    [HttpGet("{taskId}/checklist")]
    public async Task<ActionResult<IEnumerable<ChecklistItem>>> GetChecklistItems(string taskId)
    {
        var items = await _context.ChecklistItems
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("{taskId}/checklist")]
    public async Task<ActionResult<ChecklistItem>> AddChecklistItem(string taskId, [FromBody] CreateChecklistItemRequest request)
    {
        var task = await _taskService.GetTaskByIdAsync(taskId);
        if (task == null)
            return NotFound("Task not found");

        var maxOrder = await _context.ChecklistItems
            .Where(c => c.TaskId == taskId)
            .MaxAsync(c => (int?)c.SortOrder) ?? 0;

        var item = new ChecklistItem
        {
            Title = request.Title,
            TaskId = taskId,
            SortOrder = maxOrder + 1
        };

        _context.ChecklistItems.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChecklistItems), new { taskId }, item);
    }

    [HttpPatch("{taskId}/checklist/{itemId}")]
    public async Task<ActionResult<ChecklistItem>> UpdateChecklistItem(string taskId, string itemId, [FromBody] UpdateChecklistItemRequest request)
    {
        var item = await _context.ChecklistItems.FirstOrDefaultAsync(c => c.Id == itemId && c.TaskId == taskId);
        if (item == null)
            return NotFound();

        if (request.Title != null) item.Title = request.Title;
        if (request.IsCompleted != null) item.IsCompleted = request.IsCompleted.Value;
        if (request.SortOrder != null) item.SortOrder = request.SortOrder.Value;

        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{taskId}/checklist/{itemId}")]
    public async Task<IActionResult> DeleteChecklistItem(string taskId, string itemId)
    {
        var item = await _context.ChecklistItems.FirstOrDefaultAsync(c => c.Id == itemId && c.TaskId == taskId);
        if (item == null)
            return NotFound();

        _context.ChecklistItems.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateTaskRequest(
    string Title,
    string? Description,
    string ProjectId,
    string? CreatorId,
    string? AssigneeId,
    TaskPriority Priority = TaskPriority.Medium,
    DateTime? DueDate = null,
    string? ParentId = null,
    TaskType Type = TaskType.Task
);

public record UpdateTaskRequest(
    string? Title,
    string? Description,
    Models.TaskStatus? Status,
    TaskPriority? Priority,
    DateTime? DueDate,
    string? AssigneeId,
    double? EstimatedHours,
    double? ActualHours,
    int? SortOrder,
    TaskType? Type
);

public record UpdateStatusRequest(Models.TaskStatus Status);

public record CreateChecklistItemRequest(string Title);

public record UpdateChecklistItemRequest(string? Title, bool? IsCompleted, int? SortOrder);
