namespace NexusProjectHub.API.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IWebHostEnvironment env, ILogger<LocalFileStorageService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folderName, string? ownerId = null)
    {
        var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads", folderName);
        Directory.CreateDirectory(uploadsPath);

        var fileExt = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid():N}{fileExt}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(stream);
        }

        return $"/uploads/{folderName}/{uniqueName}";
    }

    public Task DeleteFileAsync(string fileUrl, string? ownerId = null)
    {
        try
        {
            var filePath = Path.Combine(_env.ContentRootPath, fileUrl.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete local file: {FileUrl}", fileUrl);
        }

        return Task.CompletedTask;
    }

    public async Task<byte[]> DownloadFileAsync(string fileUrl, string? ownerId = null)
    {
        var filePath = Path.Combine(_env.ContentRootPath, fileUrl.TrimStart('/'));
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("File not found", filePath);
        }

        return await File.ReadAllBytesAsync(filePath);
    }
}
