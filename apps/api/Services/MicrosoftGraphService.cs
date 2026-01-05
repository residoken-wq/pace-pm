using Microsoft.Graph;
using Microsoft.Identity.Web;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Services;

public class MicrosoftGraphService : IMicrosoftGraphService
{
    private readonly GraphServiceClient _graphClient;
    private readonly AppDbContext _db;
    private readonly ILogger<MicrosoftGraphService> _logger;

    public MicrosoftGraphService(
        GraphServiceClient graphClient,
        AppDbContext db,
        ILogger<MicrosoftGraphService> logger)
    {
        _graphClient = graphClient;
        _db = db;
        _logger = logger;
    }

    public async Task<User> GetOrCreateUserAsync(string accessToken)
    {
        try
        {
            // Get user info from Microsoft Graph
            var graphUser = await _graphClient.Me.GetAsync();
            
            if (graphUser == null || string.IsNullOrEmpty(graphUser.Id))
                throw new InvalidOperationException("Failed to get user from Microsoft Graph");

            // Check if user exists in our database
            var existingUser = _db.Users.FirstOrDefault(u => u.MicrosoftId == graphUser.Id);
            
            if (existingUser != null)
            {
                // Update user info
                existingUser.DisplayName = graphUser.DisplayName ?? existingUser.DisplayName;
                existingUser.Email = graphUser.Mail ?? graphUser.UserPrincipalName ?? existingUser.Email;
                existingUser.JobTitle = graphUser.JobTitle;
                existingUser.Department = graphUser.Department;
                existingUser.UpdatedAt = DateTime.UtcNow;
                
                await _db.SaveChangesAsync();
                return existingUser;
            }

            // Create new user
            var newUser = new User
            {
                MicrosoftId = graphUser.Id,
                Email = graphUser.Mail ?? graphUser.UserPrincipalName ?? "",
                DisplayName = graphUser.DisplayName ?? "Unknown",
                JobTitle = graphUser.JobTitle,
                Department = graphUser.Department
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Created new user: {Email}", newUser.Email);
            return newUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetOrCreateUserAsync");
            throw;
        }
    }

    public async Task SendTeamsNotificationAsync(string channelId, string message)
    {
        try
        {
            // Parse channelId format: "teamId/channelId"
            var parts = channelId.Split('/');
            if (parts.Length != 2)
                throw new ArgumentException("Invalid channelId format. Expected: teamId/channelId");

            var teamId = parts[0];
            var teamChannelId = parts[1];

            // Create Adaptive Card message
            var chatMessage = new Microsoft.Graph.Models.ChatMessage
            {
                Body = new Microsoft.Graph.Models.ItemBody
                {
                    ContentType = Microsoft.Graph.Models.BodyType.Html,
                    Content = message
                }
            };

            await _graphClient.Teams[teamId].Channels[teamChannelId].Messages
                .PostAsync(chatMessage);

            _logger.LogInformation("Sent Teams notification to channel {ChannelId}", channelId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Teams notification");
            throw;
        }
    }

    public async Task<string> CreateCalendarEventAsync(string userId, ProjectTask task)
    {
        try
        {
            if (task.DueDate == null)
                throw new ArgumentException("Task must have a due date");

            var calendarEvent = new Microsoft.Graph.Models.Event
            {
                Subject = $"[Nexus] {task.Title}",
                Body = new Microsoft.Graph.Models.ItemBody
                {
                    ContentType = Microsoft.Graph.Models.BodyType.Html,
                    Content = task.Description ?? ""
                },
                Start = new Microsoft.Graph.Models.DateTimeTimeZone
                {
                    DateTime = task.DueDate.Value.ToString("yyyy-MM-ddTHH:mm:ss"),
                    TimeZone = "UTC"
                },
                End = new Microsoft.Graph.Models.DateTimeTimeZone
                {
                    DateTime = task.DueDate.Value.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss"),
                    TimeZone = "UTC"
                },
                IsReminderOn = true,
                ReminderMinutesBeforeStart = 60
            };

            var result = await _graphClient.Users[userId].Calendar.Events
                .PostAsync(calendarEvent);

            _logger.LogInformation("Created calendar event for task {TaskId}", task.Id);
            return result?.Id ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating calendar event for task {TaskId}", task.Id);
            throw;
        }
    }

    public async Task<string> CreateTodoTaskAsync(string userId, ProjectTask task)
    {
        try
        {
            var todoTask = new Microsoft.Graph.Models.TodoTask
            {
                Title = task.Title,
                Body = new Microsoft.Graph.Models.ItemBody
                {
                    Content = task.Description ?? "",
                    ContentType = Microsoft.Graph.Models.BodyType.Text
                },
                Importance = task.Priority switch
                {
                    TaskPriority.Urgent => Microsoft.Graph.Models.Importance.High,
                    TaskPriority.High => Microsoft.Graph.Models.Importance.High,
                    TaskPriority.Medium => Microsoft.Graph.Models.Importance.Normal,
                    _ => Microsoft.Graph.Models.Importance.Low
                }
            };

            if (task.DueDate.HasValue)
            {
                todoTask.DueDateTime = new Microsoft.Graph.Models.DateTimeTimeZone
                {
                    DateTime = task.DueDate.Value.ToString("yyyy-MM-ddTHH:mm:ss"),
                    TimeZone = "UTC"
                };
            }

            // Get or create the Nexus task list
            var taskLists = await _graphClient.Users[userId].Todo.Lists.GetAsync();
            var nexusList = taskLists?.Value?.FirstOrDefault(l => l.DisplayName == "Nexus Project Hub");
            
            string listId;
            if (nexusList == null)
            {
                var newList = await _graphClient.Users[userId].Todo.Lists.PostAsync(
                    new Microsoft.Graph.Models.TodoTaskList { DisplayName = "Nexus Project Hub" });
                listId = newList?.Id ?? throw new InvalidOperationException("Failed to create task list");
            }
            else
            {
                listId = nexusList.Id ?? throw new InvalidOperationException("Task list has no ID");
            }

            var result = await _graphClient.Users[userId].Todo.Lists[listId].Tasks
                .PostAsync(todoTask);

            _logger.LogInformation("Created To-Do task for {TaskId}", task.Id);
            return result?.Id ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating To-Do task for {TaskId}", task.Id);
            throw;
        }
    }

    public async Task<string> UploadToOneDriveAsync(string userId, string fileName, Stream fileStream)
    {
        try
        {
            // Upload to OneDrive root/NexusProjectHub folder
            var result = await _graphClient.Users[userId].Drive.Root
                .ItemWithPath($"NexusProjectHub/{fileName}")
                .Content
                .PutAsync(fileStream);

            _logger.LogInformation("Uploaded file {FileName} to OneDrive", fileName);
            return result?.Id ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file {FileName} to OneDrive", fileName);
            throw;
        }
    }
}
