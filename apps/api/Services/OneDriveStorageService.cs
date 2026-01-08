using NexusProjectHub.API.Models;

namespace NexusProjectHub.API.Services;

public class OneDriveStorageService : IFileStorageService
{
    private readonly IMicrosoftGraphService _graphService;
    private readonly ILogger<OneDriveStorageService> _logger;

    public OneDriveStorageService(IMicrosoftGraphService graphService, ILogger<OneDriveStorageService> logger)
    {
        _graphService = graphService;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folderName, string? ownerId = null)
    {
        if (string.IsNullOrEmpty(ownerId))
        {
            throw new ArgumentException("OwnerId is required for OneDrive storage");
        }

        // Upload to User's OneDrive
        // We might want to use 'folderName' (taskId) as part of the path or metadata
        // For now, let's keep it simple: NexusProjectHub/{fileName}
        // But duplicates are possible. Let's prepend folderName (taskId) to filename or use a folder structure
        
        // Let's assume folderName is TaskId.
        // Path: NexusProjectHub/{TaskId}/{fileName}
        
        // Wait, UploadToOneDriveAsync in GraphService currently takes just fileName and puts it in NexusProjectHub/{fileName}.
        // I should update MicrosoftGraphService to support folder path or update OneDriveStorageService to construct the name.
        
        // Let's modify the GraphService call to handle the path in the "fileName" argument effectively, 
        // effectively passing "TaskId/Filename" if the service supports "ItemWithPath" handles slashes.
        // Yes, ItemWithPath("foo/bar") works.
        
        var fullPath = $"{folderName}/{fileName}";
        var fileId = await _graphService.UploadToOneDriveAsync(ownerId, fullPath, fileStream);
        
        // Valid fileUrl for OneDrive?
        // We can store the File ID as the URL for now, or a special scheme like "onedrive:{fileId}"
        // But the frontend expects a URL to download from our API.
        // Our API's DownloadFile will take this "URL".
        // If we store just the ID, we need to know it's a OneDrive ID.
        // Let's store "onedrive:{fileId}"
        
        return $"onedrive:{fileId}";
    }

    public async Task DeleteFileAsync(string fileUrl, string? ownerId = null)
    {
        if (string.IsNullOrEmpty(ownerId)) return;

        if (fileUrl.StartsWith("onedrive:"))
        {
            var fileId = fileUrl.Substring("onedrive:".Length);
            await _graphService.DeleteFileFromOneDriveAsync(ownerId, fileId);
        }
    }

    public async Task<byte[]> DownloadFileAsync(string fileUrl, string? ownerId = null)
    {
        if (string.IsNullOrEmpty(ownerId)) 
            throw new ArgumentException("OwnerId is required for OneDrive download");

        if (fileUrl.StartsWith("onedrive:"))
        {
            var fileId = fileUrl.Substring("onedrive:".Length);
            return await _graphService.DownloadFileFromOneDriveAsync(ownerId, fileId);
        }
        
        throw new ArgumentException("Invalid file URL scheme");
    }
}
