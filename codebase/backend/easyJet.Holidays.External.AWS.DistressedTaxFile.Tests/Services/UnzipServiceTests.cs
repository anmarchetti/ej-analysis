using easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
using Microsoft.Extensions.Logging;
using Moq;
using System.IO.Compression;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Tests.Services;

public class UnzipServiceTests
{
    private readonly Mock<ILogger<UnzipService>> _mockLogger;
    private readonly UnzipService _unzipService;

    public UnzipServiceTests()
    {
        _mockLogger = new Mock<ILogger<UnzipService>>();
        _unzipService = new UnzipService(_mockLogger.Object);
    }

    [Fact]
    public async Task UnzipSingleFileToByteArray_ValidZip_ReturnsFileContent()
    {
        // Arrange
        byte[] fileContent = Encoding.UTF8.GetBytes("Test file content");
        byte[] zipFileBytes = CreateZipWithSingleFile("test.txt", fileContent);

        // Act
        byte[] result = await _unzipService.UnzipSingleFileToByteArray(zipFileBytes);

        // Assert
        Assert.Equal(fileContent, result);
        _mockLogger.Verify(x => x.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString() == "File successfully unzipped"),
            null,
            (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task UnzipSingleFileToByteArray_EmptyZip_ThrowsFileNotFoundException()
    {
        // Arrange
        byte[] zipFileBytes = CreateEmptyZip();

        // Act & Assert
        await Assert.ThrowsAsync<FileNotFoundException>(() => _unzipService.UnzipSingleFileToByteArray(zipFileBytes));
    }

    private static byte[] CreateZipWithSingleFile(string fileName, byte[] fileContent)
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            var entry = archive.CreateEntry(fileName);
            using (var entryStream = entry.Open())
            {
                entryStream.Write(fileContent, 0, fileContent.Length);
            }
        }
        return memoryStream.ToArray();
    }

    private static byte[] CreateEmptyZip()
    {
        using var memoryStream = new MemoryStream();
        using (new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            // Create empty ZIP with no entries
        }

        return memoryStream.ToArray();
    }
}