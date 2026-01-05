using System.ComponentModel.DataAnnotations;

namespace NexusProjectHub.API.Models;

public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string MicrosoftId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string DisplayName { get; set; } = string.Empty;
    
    public string? AvatarUrl { get; set; }
    
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    
    [MaxLength(100)]
    public string? Department { get; set; }
    
    // Navigation
    public ICollection<WorkspaceMember> Workspaces { get; set; } = new List<WorkspaceMember>();
    public ICollection<ProjectTask> AssignedTasks { get; set; } = new List<ProjectTask>();
    public ICollection<ProjectTask> CreatedTasks { get; set; } = new List<ProjectTask>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Workspace
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public string? LogoUrl { get; set; }
    
    // Microsoft 365 Integration
    public string? TeamsTeamId { get; set; }
    public string? TeamsChannelId { get; set; }
    public string? SharePointSiteId { get; set; }
    public string? SharePointFolderId { get; set; }
    
    // Navigation
    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class WorkspaceMember
{
    public string WorkspaceId { get; set; } = string.Empty;
    public Workspace Workspace { get; set; } = null!;
    
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public enum WorkspaceRole
{
    Owner,
    Admin,
    Member,
    Viewer
}
