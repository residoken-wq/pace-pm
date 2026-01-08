namespace NexusProjectHub.API.Services;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string folderName, string? ownerId = null);
    Task DeleteFileAsync(string fileUrl, string? ownerId = null);
    Task<byte[]> DownloadFileAsync(string fileUrl, string? ownerId = null);
}
