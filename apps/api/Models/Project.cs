using System.ComponentModel.DataAnnotations;

namespace NexusProjectHub.API.Models;

public class Project
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    
    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }
    
    public decimal? Budget { get; set; }
    
    // AI Insights
    public string? LastAiSummary { get; set; }
    public double? RiskScore { get; set; }
    
    // Foreign Keys
    public string WorkspaceId { get; set; } = string.Empty;
    public Workspace Workspace { get; set; } = null!;
    
    // Navigation
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ProjectStatus
{
    Planning,
    Active,
    OnHold,
    Completed,
    Archived
}

public class ProjectTask
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    
    public DateTime? DueDate { get; set; }
    
    public double? EstimatedHours { get; set; }
    public double? ActualHours { get; set; }
    
    public int SortOrder { get; set; } = 0;

    public bool IsMilestone { get; set; } = false;
    
    // Microsoft 365 Sync
    public string? OutlookEventId { get; set; }
    public string? TodoTaskId { get; set; }
    public string? TeamsMessageId { get; set; }
    
    // Foreign Keys
    public string ProjectId { get; set; } = string.Empty;
    public Project Project { get; set; } = null!;
    
    public string? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    
    public string CreatorId { get; set; } = string.Empty;
    public User Creator { get; set; } = null!;
    
    public string? ParentId { get; set; }
    public ProjectTask? Parent { get; set; }
    
    // Navigation
    public ICollection<ProjectTask> Subtasks { get; set; } = new List<ProjectTask>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum TaskStatus
{
    Todo,
    InProgress,
    InReview,
    Done,
    Cancelled
}

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public class Comment
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    public string TaskId { get; set; } = string.Empty;
    public ProjectTask Task { get; set; } = null!;
    
    public string AuthorId { get; set; } = string.Empty;
    public User Author { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Attachment
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public string FileUrl { get; set; } = string.Empty;
    
    public long FileSize { get; set; }
    
    [MaxLength(100)]
    public string? MimeType { get; set; }
    
    // OneDrive/SharePoint reference
    public string? DriveItemId { get; set; }
    
    public string TaskId { get; set; } = string.Empty;
    public ProjectTask Task { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
