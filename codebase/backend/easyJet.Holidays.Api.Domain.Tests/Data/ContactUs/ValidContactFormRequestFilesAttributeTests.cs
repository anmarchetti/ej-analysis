using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Data.ContactUs;

public class ValidContactFormRequestFilesAttributeTests
{
    private static readonly string[] AllowedExtensions = [".jpg", ".png", ".pdf"];
    private const int MaxSizeBytes = 10_000_000; // 10 MB

    private readonly ValidContactFormRequestFilesAttribute _attribute = new();

    private static ValidationContext CreateValidationContext(string displayName = "Files")
    {
        var settings = Options.Create(new ContactUsSettings
        {
            RequestFormAttachmentAllowedExtensions = AllowedExtensions,
            RequestFormAttachmentMaxSizeOfAllFiles = MaxSizeBytes
        });

        var services = new Mock<IServiceProvider>();
        services
            .Setup(x => x.GetService(typeof(IOptions<ContactUsSettings>)))
            .Returns(settings);

        return new ValidationContext(new object(), services.Object, null) { DisplayName = displayName };
    }

    private static Mock<IFormFile> CreateFileMock(string fileName, long lengthInBytes)
    {
        var file = new Mock<IFormFile>();
        file.Setup(f => f.FileName).Returns(fileName);
        file.Setup(f => f.Length).Returns(lengthInBytes);

        return file;
    }

    [Fact]
    public void IsValid_ValueIsNotFormFileCollection_ReturnsSuccess()
    {
        // Arrange
        var context = CreateValidationContext();

        // Act
        var result = _attribute.GetValidationResult("not a file collection", context);

        // Assert
        result.Should().Be(ValidationResult.Success);
    }

    [Fact]
    public void IsValid_ValueIsNull_ReturnsSuccess()
    {
        // Arrange
        var context = CreateValidationContext();

        // Act
        var result = _attribute.GetValidationResult(null, context);

        // Assert
        result.Should().Be(ValidationResult.Success);
    }

    [Fact]
    public void IsValid_ValidFiles_ReturnsSuccess()
    {
        // Arrange
        var files = new FormFileCollection
        {
            CreateFileMock("photo.jpg", 500_000).Object,
            CreateFileMock("document.pdf", 1_000_000).Object,
        };
        var context = CreateValidationContext();

        // Act
        var result = _attribute.GetValidationResult(files, context);

        // Assert
        result.Should().Be(ValidationResult.Success);
    }

    [Fact]
    public void IsValid_InvalidExtension_ReturnsError()
    {
        // Arrange
        var files = new FormFileCollection
        {
            CreateFileMock("script.exe", 1_000).Object,
        };
        var context = CreateValidationContext();

        // Act
        var result = _attribute.GetValidationResult(files, context);

        // Assert
        result.Should().NotBe(ValidationResult.Success);
        result!.ErrorMessage.Should().Contain("allowed extensions");
    }

    [Fact]
    public void IsValid_CombinedSizeExceedsLimit_ReturnsError()
    {
        // Arrange
        var files = new FormFileCollection
        {
            CreateFileMock("large1.jpg", 6_000_000).Object,
            CreateFileMock("large2.png", 5_000_000).Object,
        };
        var context = CreateValidationContext();

        // Act
        var result = _attribute.GetValidationResult(files, context);

        // Assert
        result.Should().NotBe(ValidationResult.Success);
        result!.ErrorMessage.Should().Contain("Maximum allowed upload size");
    }

    [Fact]
    public void IsValid_SettingsNotRegistered_ThrowsInvalidOperationException()
    {
        // Arrange
        var files = new FormFileCollection
        {
            CreateFileMock("photo.jpg", 1_000).Object,
        };

        var services = new Mock<IServiceProvider>();
        services
            .Setup(x => x.GetService(typeof(IOptions<ContactUsSettings>)))
            .Returns(null!);

        var context = new ValidationContext(new object(), services.Object, null) { DisplayName = "Files" };

        // Act
        var act = () => _attribute.GetValidationResult(files, context);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*ContactUsSettings*");
    }
}
