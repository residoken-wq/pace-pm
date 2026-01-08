using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<FilesController> _logger;
    private readonly IWebHostEnvironment _env;

    public FilesController(AppDbContext db, ILogger<FilesController> logger, IWebHostEnvironment env)
    {
        _db = db;
        _logger = logger;
        _env = env;
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

        // Create uploads directory
        var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads", request.TaskId);
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var fileExt = Path.GetExtension(request.File.FileName);
        var uniqueName = $"{Guid.NewGuid():N}{fileExt}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        // Create attachment record
        var attachment = new Attachment
        {
            FileName = request.File.FileName,
            FileUrl = $"/uploads/{request.TaskId}/{uniqueName}",
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            TaskId = request.TaskId
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
    public async Task<ActionResult> DeleteAttachment(string id)
    {
        var attachment = await _db.Attachments.FindAsync(id);
        if (attachment == null)
            return NotFound();

        // Try to delete physical file
        try
        {
            var filePath = Path.Combine(_env.ContentRootPath, attachment.FileUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
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

        var filePath = Path.Combine(_env.ContentRootPath, attachment.FileUrl.TrimStart('/'));
        if (!System.IO.File.Exists(filePath))
            return NotFound("File not found on server");

        var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(bytes, attachment.MimeType ?? "application/octet-stream", attachment.FileName);
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
