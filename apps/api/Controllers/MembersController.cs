using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<MembersController> _logger;

    public MembersController(AppDbContext db, ILogger<MembersController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // GET: api/members?workspaceId=xxx
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MemberDto>>> GetMembers([FromQuery] string workspaceId)
    {
        if (string.IsNullOrEmpty(workspaceId))
            return BadRequest("workspaceId is required");

        var members = await _db.WorkspaceMembers
            .Include(m => m.User)
            .Where(m => m.WorkspaceId == workspaceId)
            .Select(m => new MemberDto
            {
                UserId = m.UserId,
                Email = m.User.Email,
                DisplayName = m.User.DisplayName,
                AvatarUrl = m.User.AvatarUrl,
                JobTitle = m.User.JobTitle,
                Department = m.User.Department,
                Role = m.Role.ToString(),
                JoinedAt = m.JoinedAt
            })
            .ToListAsync();

        return Ok(members);
    }

    // GET: api/members/users - Get all users for assignment dropdown
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        var users = await _db.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                JobTitle = u.JobTitle,
                Department = u.Department
            })
            .Take(100)
            .ToListAsync();

        return Ok(users);
    }

    // POST: api/members - Add member to workspace
    [HttpPost]
    public async Task<ActionResult<MemberDto>> AddMember([FromBody] AddMemberRequest request)
    {
        // Check if user exists, if not create from email
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            user = new User
            {
                Email = request.Email,
                DisplayName = request.DisplayName ?? request.Email.Split('@')[0],
                MicrosoftId = request.MicrosoftId ?? ""
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // Check if already a member
        var existing = await _db.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == request.WorkspaceId && m.UserId == user.Id);

        if (existing != null)
            return Conflict("User is already a member of this workspace");

        // Add member
        var member = new WorkspaceMember
        {
            WorkspaceId = request.WorkspaceId,
            UserId = user.Id,
            Role = Enum.TryParse<WorkspaceRole>(request.Role, out var role) ? role : WorkspaceRole.Member
        };

        _db.WorkspaceMembers.Add(member);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMembers), new { workspaceId = request.WorkspaceId }, new MemberDto
        {
            UserId = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Role = member.Role.ToString(),
            JoinedAt = member.JoinedAt
        });
    }

    // PUT: api/members/{userId}/role - Update member role
    [HttpPut("{userId}/role")]
    public async Task<ActionResult> UpdateRole(string userId, [FromBody] UpdateRoleRequest request)
    {
        var member = await _db.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == request.WorkspaceId && m.UserId == userId);

        if (member == null)
            return NotFound();

        if (!Enum.TryParse<WorkspaceRole>(request.Role, out var newRole))
            return BadRequest("Invalid role");

        member.Role = newRole;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/members/{userId}?workspaceId=xxx - Remove member
    [HttpDelete("{userId}")]
    public async Task<ActionResult> RemoveMember(string userId, [FromQuery] string workspaceId)
    {
        var member = await _db.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId);

        if (member == null)
            return NotFound();

        // Cannot remove owner
        if (member.Role == WorkspaceRole.Owner)
            return BadRequest("Cannot remove workspace owner");

        _db.WorkspaceMembers.Remove(member);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/members/workload?workspaceId=xxx - Get member workload
    [HttpGet("workload")]
    public async Task<ActionResult<IEnumerable<WorkloadDto>>> GetWorkload([FromQuery] string workspaceId)
    {
        var members = await _db.WorkspaceMembers
            .Include(m => m.User)
                .ThenInclude(u => u.AssignedTasks)
            .Where(m => m.WorkspaceId == workspaceId)
            .Select(m => new WorkloadDto
            {
                UserId = m.UserId,
                DisplayName = m.User.DisplayName,
                AvatarUrl = m.User.AvatarUrl,
                TotalTasks = m.User.AssignedTasks.Count,
                TodoTasks = m.User.AssignedTasks.Count(t => t.Status == TaskStatus.Todo),
                InProgressTasks = m.User.AssignedTasks.Count(t => t.Status == TaskStatus.InProgress),
                DoneTasks = m.User.AssignedTasks.Count(t => t.Status == TaskStatus.Done),
                OverdueTasks = m.User.AssignedTasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != TaskStatus.Done)
            })
            .ToListAsync();

        return Ok(members);
    }
}

// DTOs
public record MemberDto
{
    public string UserId { get; init; } = "";
    public string Email { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string? AvatarUrl { get; init; }
    public string? JobTitle { get; init; }
    public string? Department { get; init; }
    public string Role { get; init; } = "Member";
    public DateTime JoinedAt { get; init; }
}

public record UserDto
{
    public string Id { get; init; } = "";
    public string Email { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string? AvatarUrl { get; init; }
    public string? JobTitle { get; init; }
    public string? Department { get; init; }
}

public record WorkloadDto
{
    public string UserId { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string? AvatarUrl { get; init; }
    public int TotalTasks { get; init; }
    public int TodoTasks { get; init; }
    public int InProgressTasks { get; init; }
    public int DoneTasks { get; init; }
    public int OverdueTasks { get; init; }
}

public record AddMemberRequest(
    string WorkspaceId,
    string Email,
    string? DisplayName,
    string? MicrosoftId,
    string Role = "Member"
);

public record UpdateRoleRequest(
    string WorkspaceId,
    string Role
);
