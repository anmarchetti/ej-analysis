using Amazon.Lambda.S3Events;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Models;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Tests.Services;

public class DistressedFileHandlerTests
{
    private readonly Mock<IS3FileService> _s3FileServiceMock;
    private readonly Mock<IUnzipService> _unzipServiceMock;
    private readonly Mock<ILogger<DistressedFileHandler>> _loggerMock;
    private readonly LambdaSettings _lambdaSettings;

    private readonly DistressedFileHandler _sut;

    public DistressedFileHandlerTests()
    {
        _s3FileServiceMock = new();
        _unzipServiceMock = new();
        _loggerMock = new();

        _lambdaSettings = new LambdaSettings
        {
            S3BucketName = "test-bucket",
            S3TaxFileObjectKey = "taxFile.xlsx",
            UploadBucketName = "upload-bucket",
            UploadBucketFolders = "folder1,folder2",
            EnableTaxCalculation = true,
            DepartureAirportsChildTaxFree = "LHR,JFK",
            NewFareClassPhaseOneEnabled = false
        };

        _sut = new(_s3FileServiceMock.Object, _unzipServiceMock.Object, _loggerMock.Object, Options.Create(_lambdaSettings));
    }

    [Fact]
    public async Task Run_ShouldProcessDistressedFileAndUploadWithoutTaxCalculation()
    {
        // Arrange
        var s3Event = new S3Event.S3EventNotificationRecord
        {
            S3 = new S3Event.S3Entity
            {
                Bucket = new S3Event.S3BucketEntity { Name = "test-bucket" },
                Object = new S3Event.S3ObjectEntity { Key = "DiscountedTest1_20241021.csv.zip" }
            }
        };

        // Mock the tax file download (empty as taxes are not enabled)
        _s3FileServiceMock.Setup(s => s.Download(_lambdaSettings.S3BucketName, _lambdaSettings.S3TaxFileObjectKey))
            .ReturnsAsync(CreateDummyTaxFile(new List<TaxDataRow>()));

        // Mock downloading and unzipping the distressed file
        var distressedFileContent = CreateTestCsvFileByteArray();
        _s3FileServiceMock.Setup(s => s.Download("test-bucket", "DiscountedTest1_20241021.csv.zip"))
            .ReturnsAsync(distressedFileContent);
        _unzipServiceMock.Setup(u => u.UnzipSingleFileToByteArray(distressedFileContent))
            .ReturnsAsync(distressedFileContent);

        // Mock the file upload operation
        _s3FileServiceMock.Setup(s => s.UploadFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.Process(s3Event);

        // Assert
        _s3FileServiceMock.Verify(s => s.UploadFile(
            It.Is<string>(bucket => bucket == _lambdaSettings.UploadBucketName),
            It.Is<string>(key => key.Contains("DailyDistressed")),
            It.IsAny<Stream>()), Times.AtLeastOnce);
    }

    [Theory]
    [AutoMoqData]
    public async Task Run_ShouldProcessDistressedFileAndUploadWithTaxCalculation(ReadOnlyCollection<TaxDataRow> taxesList)
    {
        // Arrange
        var s3Event = new S3Event.S3EventNotificationRecord
        {
            S3 = new S3Event.S3Entity
            {
                Bucket = new S3Event.S3BucketEntity { Name = "test-bucket" },
                Object = new S3Event.S3ObjectEntity { Key = "DiscountedTest1_20241021.csv.zip" }
            }
        };

        // Mock downloading and unzipping distressed file
        var distressedFileContent = CreateTestCsvFileByteArray();
        _s3FileServiceMock.Setup(s => s.Download("test-bucket", "DiscountedTest1_20241021.csv.zip"))
            .ReturnsAsync(distressedFileContent);
        _unzipServiceMock.Setup(u => u.UnzipSingleFileToByteArray(distressedFileContent))
            .ReturnsAsync(distressedFileContent);

        // Mock downloading the tax file
        _s3FileServiceMock.Setup(s => s.Download(_lambdaSettings.S3BucketName, _lambdaSettings.S3TaxFileObjectKey))
            .ReturnsAsync(CreateDummyTaxFile(taxesList));

        // Mock the file upload operation
        _s3FileServiceMock.Setup(s => s.UploadFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.Process(s3Event);

        // Assert
        _s3FileServiceMock.Verify(s => s.UploadFile(
            It.Is<string>(bucket => bucket == _lambdaSettings.UploadBucketName),
            It.Is<string>(key => key.Contains("DailyDistressed")),
            It.IsAny<Stream>()), Times.AtLeastOnce);
    }

    [Theory]
    [InlineData(100, 100, false)] // same size
    [InlineData(110, 100, false)] // larger
    [InlineData(91, 100, false)]  // 9% smaller, within the 10% tolerance
    [InlineData(89, 100, true)]   // 11% smaller, exceeds the 10% tolerance
    public void IsLatestFileCorrupted_ChecksFileSizeCorrectly(long currentFileSize, long previousFileSize, bool expectedResult)
    {
        // Arrange
        var previousFile = new FileProperties
        {
            Size = previousFileSize,
            LastWriteTime = DateTime.Now.AddDays(-1)
        };

        // Act
        var result = InvokeIsLatestFileCorrupted(previousFile, currentFileSize);

        // Assert
        Assert.Equal(expectedResult, result);

        // Detailed validation logging only happens when the file size decreased
        if (currentFileSize < previousFileSize)
        {
            VerifyLogInfoContains("Check if the latest file is valid");
        }
    }

    [Fact]
    public void IsLatestFileCorrupted_WhenNoPreviousFileExists_ReturnsFalse()
    {
        // Act
        var result = InvokeIsLatestFileCorrupted(null, 100);

        // Assert
        Assert.False(result);
        VerifyLogInfoContains("Can't check if the last file is the correct size");
    }

    private bool InvokeIsLatestFileCorrupted(FileProperties previousFile, long currentFileSize)
    {
        // Use reflection to access the private method
        var method = typeof(DistressedFileHandler).GetMethod("IsLatestFileCorrupted",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        return (bool)method!.Invoke(_sut, new object[] { previousFile, currentFileSize })!;
    }

    [Fact]
    public async Task Process_WhenInPhaseOneOfNewFareClass_BuildsEmptyFile_WhichDoesNotTripCorruptionDetection()
    {
        // Arrange
        _lambdaSettings.NewFareClassPhaseOneEnabled = true;
        var s3Event = new S3Event.S3EventNotificationRecord
        {
            S3 = new S3Event.S3Entity
            {
                Bucket = new S3Event.S3BucketEntity { Name = "test-bucket" },
                Object = new S3Event.S3ObjectEntity { Key = "DiscountedTest1_20241021.csv.zip" }
            }
        };

        // Mock the tax file download (empty as taxes are not enabled)
        _s3FileServiceMock.Setup(s => s.Download(_lambdaSettings.S3BucketName, _lambdaSettings.S3TaxFileObjectKey))
            .ReturnsAsync(CreateDummyTaxFile(new List<TaxDataRow>()));

        // Mock downloading and unzipping the distressed file
        var distressedFileContent = CreateTestCsvFileByteArray();
        _s3FileServiceMock.Setup(s => s.Download("test-bucket", "DiscountedTest1_20241021.csv.zip"))
            .ReturnsAsync(distressedFileContent);
        _unzipServiceMock.Setup(u => u.UnzipSingleFileToByteArray(distressedFileContent))
            .ReturnsAsync(distressedFileContent);

        var args = new List<Stream>();

        // Mock the file upload operation
        _s3FileServiceMock.Setup(s => s.UploadFile(It.IsAny<string>(), It.IsAny<string>(), Capture.In(args)))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.Process(s3Event);

        // Assert
        _s3FileServiceMock.Verify(s => s.UploadFile(
            It.Is<string>(bucket => bucket == _lambdaSettings.UploadBucketName),
            It.Is<string>(key => key.Contains("DailyDistressed")),
            It.IsAny<Stream>()), Times.AtLeastOnce);
        
        args.Should().NotBeNullOrEmpty();
        var capture = args.First();

        var data =  CsvHelperUtils<DistressedOutputDataRowWithTaxes>.Convert(CompressUtils.FromGzip(capture)).ToList();
        data.Should().NotBeNull();
        data.Should().BeEmpty("atcom requires an empty file with valid headers for the transition period.");
    }

    [Fact]
    public async Task Process_WhenUploadedFileMuchSmallerThanPreviousFileInSameFolder_ThrowsAndDoesNotUpload()
    {
        // Arrange
        const string folder = "DISCOUNTED_SEATS/Input/";
        const string uploadedKey = folder + "DiscountedSeats_20260604.csv.gz";

        var s3Event = new S3Event.S3EventNotificationRecord
        {
            S3 = new S3Event.S3Entity
            {
                Bucket = new S3Event.S3BucketEntity { Name = "test-bucket" },
                Object = new S3Event.S3ObjectEntity { Key = uploadedKey, Size = 70 }
            }
        };

        _s3FileServiceMock.Setup(s => s.Download(_lambdaSettings.S3BucketName, _lambdaSettings.S3TaxFileObjectKey))
            .ReturnsAsync(CreateDummyTaxFile(new List<TaxDataRow>()));

        var distressedFileContent = CreateTestCsvFileByteArray();
        _s3FileServiceMock.Setup(s => s.Download("test-bucket", uploadedKey))
            .ReturnsAsync(distressedFileContent);
        _unzipServiceMock.Setup(u => u.UnzipSingleFileToByteArray(distressedFileContent))
            .ReturnsAsync(distressedFileContent);

        // The listing is scoped to the uploaded file's folder and includes the trigger file (newest)
        // plus an older, much larger previous file. The trigger file must be excluded so the
        // comparison runs against the previous file (70 vs 100 -> 30% drop -> corrupted).
        _s3FileServiceMock.Setup(s => s.ListAll("test-bucket", folder))
            .ReturnsAsync(new List<FileProperties>
            {
                new() { FullName = uploadedKey, Size = 70, LastWriteTime = DateTime.Now },
                new() { FullName = folder + "DiscountedSeats_20260603.csv.gz", Size = 100, LastWriteTime = DateTime.Now.AddDays(-1) }
            });

        // Act
        var act = async () => await _sut.Process(s3Event);

        // Assert
        await act.Should().ThrowAsync<WarningException>();

        _s3FileServiceMock.Verify(s => s.ListAll("test-bucket", folder), Times.Once);
        _s3FileServiceMock.Verify(
            s => s.UploadFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()),
            Times.Never);
    }

    private void VerifyLogInfoContains(string expectedMessage)
    {
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(expectedMessage)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    private static byte[] CreateTestCsvFileByteArray()
    {
        // This is a simplified version of the CSV content for testing
        string csvContent = @"Segment,DepartureAirport,ArrivalAirport,FlightNumber,DepartureDate,DepartureTime,ArrivalDate,ArrivalTime,LocalCurrency,DiscountType,DiscountedSeats,NonDiscountedFare_GBP,DiscountedFare_GBP,NonDiscountedFare_EUR,DiscountedFare_EUR,NonDiscountedFare_CHF,DiscountedFare_CHF,NonDiscountedFare_USD,DiscountedFare_USD,NonDiscountedFare_CSK,DiscountedFare_CSK,NonDiscountedFare_HUF,DiscountedFare_HUF,NonDiscountedFare_DKK,DiscountedFare_DKK,NonDiscountedFare_PLN,DiscountedFare_PLN,NonDiscountedFare_SEK,DiscountedFare_SEK,NonDiscountedFare_MAD,DiscountedFare_MAD,RunDate
TestSegment,LHR,JFK,BA001,2024-10-15,10:00,2024-10-15,12:00,USD,Promo,10,1000,900,1100,1000,1200,1100,1300,1200,1400,1300,1500,1400,1600,1500,1700,1600,1800,1700,1900,1800,2024-10-15";
        return Encoding.UTF8.GetBytes(csvContent);
    }

    private static byte[] CreateDummyTaxFile(IEnumerable<TaxDataRow> taxesList)
    {
        return CsvHelperUtils<TaxDataRow>.Convert(taxesList);
    }
}