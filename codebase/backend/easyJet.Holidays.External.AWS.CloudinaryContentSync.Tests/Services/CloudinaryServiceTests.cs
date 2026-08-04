using AutoFixture;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Tests.Services;

public class CloudinaryServiceTests
{
    private readonly Mock<ICloudinary> _cloudinary;

    private readonly IFixture _fixture = new Fixture();

    private readonly CloudinaryService _sut;

    public CloudinaryServiceTests()
    {
        _cloudinary = new();

        _sut = new(_cloudinary.Object);
    }

    [Fact]
    public async Task UploadImageAsync_CorrectlyBuildsParamsForCloudinary()
    {
        // Arrange
        var folderPath = _fixture.Create<string>();
        var fileName = _fixture.Create<string>();
        var fileContent = _fixture.Create<byte[]>();

        using var fileStream = new MemoryStream(fileContent);

        // Act
        await _sut.UploadImageAsync(folderPath, fileName, fileStream);

        // Assert
        _cloudinary.Verify(mock => mock.UploadAsync(It.Is<ImageUploadParams>(
            param => 
                param.Folder == folderPath && 
                param.File.FileName == fileName && 
                param.File.Stream.Length == fileContent.Length), null), Times.Once);
    }
}