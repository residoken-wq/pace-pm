using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusProjectHub.API.Models;
using NexusProjectHub.API.Services;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects([FromQuery] string workspaceId)
    {
        if (string.IsNullOrEmpty(workspaceId))
            return BadRequest("workspaceId is required");

        var projects = await _projectService.GetProjectsAsync(workspaceId);
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(string id)
    {
        var project = await _projectService.GetProjectByIdAsync(id);
        if (project == null)
            return NotFound();

        return Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectRequest request)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            WorkspaceId = request.WorkspaceId,
            StartDate = request.StartDate,
            TargetDate = request.TargetDate
        };

        var created = await _projectService.CreateProjectAsync(project);
        return CreatedAtAction(nameof(GetProject), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Project>> UpdateProject(string id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _projectService.GetProjectByIdAsync(id);
        if (project == null)
            return NotFound();

        project.Name = request.Name ?? project.Name;
        project.Description = request.Description ?? project.Description;
        project.Status = request.Status ?? project.Status;
        project.StartDate = request.StartDate ?? project.StartDate;
        project.TargetDate = request.TargetDate ?? project.TargetDate;

        var updated = await _projectService.UpdateProjectAsync(project);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(string id)
    {
        await _projectService.DeleteProjectAsync(id);
        return NoContent();
    }
}

public record CreateProjectRequest(
    string Name,
    string? Description,
    string WorkspaceId,
    DateTime? StartDate,
    DateTime? TargetDate
);

public record UpdateProjectRequest(
    string? Name,
    string? Description,
    ProjectStatus? Status,
    DateTime? StartDate,
    DateTime? TargetDate
);
