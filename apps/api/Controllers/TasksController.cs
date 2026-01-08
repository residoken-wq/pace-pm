using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusProjectHub.API.Models;
using NexusProjectHub.API.Services;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize] // Temporarily disabled for testing
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IMicrosoftGraphService _graphService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        IMicrosoftGraphService graphService,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _graphService = graphService;
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
        var task = new ProjectTask
        {
            Title = request.Title,
            Description = request.Description,
            ProjectId = request.ProjectId,
            AssigneeId = request.AssigneeId,
            CreatorId = request.CreatorId,
            Priority = request.Priority,
            DueDate = request.DueDate,
            ParentId = request.ParentId
        };

        var created = await _taskService.CreateTaskAsync(task);

        // Sync to Microsoft To-Do if assignee exists
        if (!string.IsNullOrEmpty(request.AssigneeId))
        {
            try
            {
                var todoId = await _graphService.CreateTodoTaskAsync(request.AssigneeId, created);
                created.TodoTaskId = todoId;
                await _taskService.UpdateTaskAsync(created);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync task to Microsoft To-Do");
            }
        }

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
            return NotFound();

        if (string.IsNullOrEmpty(task.AssigneeId))
            return BadRequest("Task must have an assignee");

        try
        {
            var eventId = await _graphService.CreateCalendarEventAsync(task.AssigneeId, task);
            task.OutlookEventId = eventId;
            await _taskService.UpdateTaskAsync(task);
            return Ok(new { eventId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync task to calendar");
            return StatusCode(500, "Failed to sync to calendar");
        }
    }
}

public record CreateTaskRequest(
    string Title,
    string? Description,
    string ProjectId,
    string CreatorId,
    string? AssigneeId,
    TaskPriority Priority = TaskPriority.Medium,
    DateTime? DueDate = null,
    string? ParentId = null
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
    int? SortOrder
);

public record UpdateStatusRequest(Models.TaskStatus Status);
