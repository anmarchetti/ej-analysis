using Microsoft.Extensions.Logging;
using System.IO.Compression;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
/// <summary>
/// Service that handles the extraction of files from a zip archive represented in a byte array.
/// </summary>
public class UnzipService : IUnzipService
{
    private readonly ILogger<UnzipService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="UnzipService"/> class.
    /// </summary>
    /// <param name="logger">Logger instance used to log information or errors during the unzipping process.</param>
    public UnzipService(ILogger<UnzipService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Unzips a zip file from a byte array and returns the content of the single file inside the zip as a byte array.
    /// </summary>
    /// <param name="zipFileBytes">The byte array representing the zip file.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the byte array of the unzipped file content.</returns>
    public async Task<byte[]> UnzipSingleFileToByteArray(byte[] zipFileBytes)
    {
        using MemoryStream zipStream = new(zipFileBytes);
        using ZipArchive archive = new(zipStream);
        var entry = archive.Entries.FirstOrDefault();

        if (entry != null && !string.IsNullOrEmpty(entry.Name))
        {
            using (var entryStream = entry.Open())
            using (var memoryStream = new MemoryStream())
            {
                await entryStream.CopyToAsync(memoryStream);
                _logger.LogInformation("File successfully unzipped");
                return memoryStream.ToArray();
            }
        }
        throw new FileNotFoundException("No file found in the ZIP archive.");
    }
}