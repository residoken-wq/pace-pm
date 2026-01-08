using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Models;
using NexusProjectHub.API.Services;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<FilesController> _logger;
    private readonly IFileStorageService _fileStorage;
    // private readonly IWebHostEnvironment _env; // Replaced by IFileStorageService

    public FilesController(AppDbContext db, ILogger<FilesController> logger, IFileStorageService fileStorage)
    {
        _db = db;
        _logger = logger;
        _fileStorage = fileStorage;
    }

    // GET: api/files?taskId=xxx - Get attachments for a task
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttachmentDto>>> GetAttachments([FromQuery] string taskId)
    {
        if (string.IsNullOrEmpty(taskId))
            return BadRequest("taskId is required");

        var attachments = await _db.Attachments
            .Where(a => a.TaskId == taskId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileSize = a.FileSize,
                MimeType = a.MimeType,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(attachments);
    }

    // POST: api/files/upload - Upload file
    [HttpPost("upload")]
    [Authorize] // Require auth for uploads (especially for OneDrive)
    [RequestSizeLimit(50_000_000)] // 50MB limit
    public async Task<ActionResult<AttachmentDto>> UploadFile([FromForm] UploadRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("No file provided");

        if (string.IsNullOrEmpty(request.TaskId))
            return BadRequest("taskId is required");

        // Validate task exists
        var task = await _db.Tasks.FindAsync(request.TaskId);
        if (task == null)
            return NotFound("Task not found");

        var userId = User.GetObjectId();
        // If no user/auth (e.g. dev mode without strict auth), Local storage might work without ownerId, but OneDrive requires it.
        // For now, let's proceed. 
        if (string.IsNullOrEmpty(userId)) 
        {
             // Try fallback claims if Authorize is not strictly enforced or token is different
             userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                      ?? User.FindFirst("oid")?.Value;
        }

        string fileUrl;
        try 
        {
            using var stream = request.File.OpenReadStream();
            fileUrl = await _fileStorage.UploadFileAsync(stream, request.File.FileName, request.TaskId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file");
            return StatusCode(500, "File upload failed: " + ex.Message);
        }

        // Create attachment record
        var attachment = new Attachment
        {
            FileName = request.File.FileName,
            FileUrl = fileUrl,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            TaskId = request.TaskId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync();

        _logger.LogInformation("File uploaded: {FileName} to task {TaskId}", attachment.FileName, request.TaskId);

        return CreatedAtAction(nameof(GetAttachments), new { taskId = request.TaskId }, new AttachmentDto
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            FileUrl = attachment.FileUrl,
            FileSize = attachment.FileSize,
            MimeType = attachment.MimeType,
            CreatedAt = attachment.CreatedAt
        });
    }

    // DELETE: api/files/{id} - Delete attachment
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> DeleteAttachment(string id)
    {
        var attachment = await _db.Attachments.FindAsync(id);
        if (attachment == null)
            return NotFound();

        var userId = User.GetObjectId();
        if (string.IsNullOrEmpty(userId))
             userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                      ?? User.FindFirst("oid")?.Value;

        // Try to delete physical file
        try
        {
            await _fileStorage.DeleteFileAsync(attachment.FileUrl, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete file: {FileUrl}", attachment.FileUrl);
        }

        _db.Attachments.Remove(attachment);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/files/download/{id} - Download file
    [HttpGet("download/{id}")]
    public async Task<ActionResult> DownloadFile(string id)
    {
        var attachment = await _db.Attachments.FindAsync(id);
        if (attachment == null)
            return NotFound();

        // Check if user is authorized? Public download for now if they have link? 
        // Or if we use [Authorize], they must be logged in. 
        // Ideally should check project membership.
        
        var userId = User.GetObjectId(); 
        if (string.IsNullOrEmpty(userId))
             userId = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                      ?? User.FindFirst("oid")?.Value;

        try 
        {
            var bytes = await _fileStorage.DownloadFileAsync(attachment.FileUrl, userId);
            return File(bytes, attachment.MimeType ?? "application/octet-stream", attachment.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound("File not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Download failed");
            return StatusCode(500, "Download failed");
        }
    }
}

// DTOs
public record AttachmentDto
{
    public string Id { get; init; } = "";
    public string FileName { get; init; } = "";
    public string FileUrl { get; init; } = "";
    public long FileSize { get; init; }
    public string? MimeType { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class UploadRequest
{
    public IFormFile? File { get; set; }
    public string TaskId { get; set; } = "";
}
