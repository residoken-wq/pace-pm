using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.MicrosoftId).IsUnique();
        });

        // Workspace
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // WorkspaceMember (Many-to-Many)
        modelBuilder.Entity<WorkspaceMember>(entity =>
        {
            entity.HasKey(e => new { e.WorkspaceId, e.UserId });
            
            entity.HasOne(e => e.Workspace)
                .WithMany(w => w.Members)
                .HasForeignKey(e => e.WorkspaceId);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Workspaces)
                .HasForeignKey(e => e.UserId);
        });

        // Project
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasOne(e => e.Workspace)
                .WithMany(w => w.Projects)
                .HasForeignKey(e => e.WorkspaceId);
        });

        // Task
        modelBuilder.Entity<ProjectTask>(entity =>
        {
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(e => e.ProjectId);
            
            entity.HasOne(e => e.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(e => e.AssigneeId)
                .IsRequired(false);
            
            entity.HasOne(e => e.Creator)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(e => e.CreatorId);
            
            entity.HasOne(e => e.Parent)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(e => e.ParentId)
                .IsRequired(false);
        });

        // Comment
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasOne(e => e.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(e => e.TaskId);
            
            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId);
        });

        // Attachment
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasOne(e => e.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(e => e.TaskId);
        });
    }
}
