#nullable enable
using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.ComponentModel.DataAnnotations;
using Xunit;

// ReSharper disable once CheckNamespace
namespace easyJet.Holidays.Api.Domain.Tests;

public class ValidTradeAgentFeedbackFilesAttributeTests
{
    private readonly ValidTradeAgentFeedbackFilesAttribute _attribute = new();

    [Fact]
    public void IsValid_ShouldReturnSuccess_WhenFilesAreValid()
    {
        // Arrange
        var validFile = new Mock<IFormFile>();
        validFile.Setup(f => f.FileName).Returns("validFile.jpg");
        validFile.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        validFile.Setup(f => f.ContentType).Returns("image/jpeg"); 

        var fileCollection = new FormFileCollection { validFile.Object };

        int maxFileSize = 1024 * 1024 * 10; //10MB
        ValidationContext validationContext =
            CreateValidationContext("Test Files", maxFileSize, "application/pdf,image/jpeg,image/png");

        // Act
        var result = _attribute.GetValidationResult(fileCollection, validationContext);

        // Assert
        result.Should().Be(ValidationResult.Success);
    }

    private static ValidationContext CreateValidationContext(string displayName, int maxFileSize,
        string allowedFileExtensions)
    {
        var services = new Mock<IServiceProvider>();
        
        var referenceDataService = new Mock<IReferenceDataService>();
        referenceDataService.Setup(x => x.GetTradeAgentFeedbackAttachedFileSettings())
            .ReturnsAsync(new AttachedFileSettings
            {
                MaxFileCount = 5,
                MaxFileSize = maxFileSize,
                AllowedFileExtensions = allowedFileExtensions
            });
        
        services.Setup(x => x.GetService(typeof(IReferenceDataService)))
            .Returns(referenceDataService.Object);

        return new ValidationContext(new object(), services.Object, null) { DisplayName = displayName };
    }

    [Fact]
    public void IsValid_ShouldReturnError_WhenFileExtensionIsInvalid()
    {
        // Arrange
        var invalidFile = new Mock<IFormFile>();
        invalidFile.Setup(f => f.FileName).Returns("invalidFile.jpg");
        invalidFile.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        invalidFile.Setup(f => f.ContentType).Returns("image/jpeg"); 

        var fileCollection = new FormFileCollection { invalidFile.Object };

        int maxFileSize = 1024 * 1024 * 10; //10MB
        ValidationContext validationContext =
            CreateValidationContext("Test Files", maxFileSize, "application/pdf,image/png");

        // Act
        var result = _attribute.GetValidationResult(fileCollection, validationContext);

        // Assert
        result.Should().NotBe(ValidationResult.Success);
        result?.ErrorMessage.Should().Contain("allowed extensions");
    }

    [Fact]
    public void IsValid_ShouldReturnError_WhenFileSizeExceedsLimit()
    {
        // Arrange
        var largeFile = new Mock<IFormFile>();
        largeFile.Setup(f => f.FileName).Returns("largeFile.jpg");
        largeFile.Setup(f => f.Length).Returns(1024 * 1024 * 10 + 1); // 10MB + 1B
        largeFile.Setup(f => f.ContentType).Returns("image/jpeg"); 

        var fileCollection = new FormFileCollection { largeFile.Object };

        int maxFileSize = 1024 * 1024 * 10; //10MB
        ValidationContext validationContext =
            CreateValidationContext("Test Files", maxFileSize, "application/pdf,image/jpeg,image/png");
        
        // Act
        var result = _attribute.GetValidationResult(fileCollection, validationContext);

        // Assert
        result.Should().NotBe(ValidationResult.Success);
        result?.ErrorMessage.Should().Contain("size, less, than 10MB");
    }

    [Fact]
    public void IsValid_ShouldReturnError_WhenFileCountExceedsLimit()
    {
        // Arrange
        var file1 = new Mock<IFormFile>();
        file1.Setup(f => f.FileName).Returns("file1.jpg");
        file1.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file1.Setup(f => f.ContentType).Returns("image/jpeg");

        var file2 = new Mock<IFormFile>();
        file2.Setup(f => f.FileName).Returns("file2.jpg");
        file2.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file2.Setup(f => f.ContentType).Returns("image/jpeg");

        var file3 = new Mock<IFormFile>();
        file3.Setup(f => f.FileName).Returns("file3.jpg");
        file3.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file3.Setup(f => f.ContentType).Returns("image/jpeg");

        var file4 = new Mock<IFormFile>();
        file4.Setup(f => f.FileName).Returns("file4.jpg");
        file4.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file4.Setup(f => f.ContentType).Returns("image/jpeg");

        var file5 = new Mock<IFormFile>();
        file5.Setup(f => f.FileName).Returns("file5.jpg");
        file5.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file5.Setup(f => f.ContentType).Returns("image/jpeg");

        var file6 = new Mock<IFormFile>();
        file6.Setup(f => f.FileName).Returns("file6.jpg");
        file6.Setup(f => f.Length).Returns(1024 * 500); // 500 KB
        file6.Setup(f => f.ContentType).Returns("image/jpeg");

        var fileCollection = new FormFileCollection
        {
            file1.Object,
            file2.Object,
            file3.Object,
            file4.Object,
            file5.Object,
            file6.Object
        };

        int maxFileSize = 1024 * 1024 * 10; //10MB
        ValidationContext validationContext =
            CreateValidationContext("Test Files", maxFileSize, "application/pdf,image/jpeg,image/png");

        // Act
        var result = _attribute.GetValidationResult(fileCollection, validationContext);

        // Assert
        result.Should().NotBe(ValidationResult.Success);
        result?.ErrorMessage.Should().Contain("Maximum allowed amount of attachments");
    }
}