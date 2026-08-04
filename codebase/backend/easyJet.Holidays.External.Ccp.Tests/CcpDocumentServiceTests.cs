using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Ccp.Models;
using easyJet.Holidays.External.Ccp.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Ccp.Tests;

public class CcpDocumentServiceTests
{
    private readonly CcpDocumentService _sut;
    private readonly Mock<IApiService> _apiServiceMock = new();
    private readonly CcpSettings _ccpSettings;

    public CcpDocumentServiceTests()
    {
        IFixture fixture = FixtureUtils.AutoMoqFixture();
        Mock<IOptions<CcpSettings>> ccpSettingsMock = fixture.Freeze<Mock<IOptions<CcpSettings>>>();

        _ccpSettings = new CcpSettings
        {
            CcpUrl = new Uri("https://api.ccp.com/"),
            DocumentRetrievalEndpoint = "documents",
            VatInvoicePdfEndpoint = "comms/v1/vat-invoice-pdfs",
            ApiKey = "test-api-key"
        };

        ccpSettingsMock.Setup(x => x.Value).Returns(_ccpSettings);
        _sut = new CcpDocumentService(_apiServiceMock.Object, ccpSettingsMock.Object);
    }

    [Fact]
    public void Constructor_WithNullCcpSettings_ThrowsArgumentNullException()
    {
        // Arrange
        var mockNullSettings = new Mock<IOptions<CcpSettings>>();
        mockNullSettings.Setup(x => x.Value).Returns(((CcpSettings?)null)!);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new CcpDocumentService(_apiServiceMock.Object, mockNullSettings.Object));
    }

    public static TheoryData<string> BookingReferenceTestData => new()
    {
        "TEST123",
        "BOOKING456",
        "REF789"
    };

    [Theory]
    [MemberData(nameof(BookingReferenceTestData))]
    public async Task GetBookingConfirmation_ValidInput_ReturnsStream(string bookingReference)
    {
        // Arrange
        var expectedPdfBytes = new byte[] { 1, 2, 3, 4, 5 };
        var base64Content = Convert.ToBase64String(expectedPdfBytes);
        var base64Stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(base64Content));
        
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ReturnsAsync(base64Stream);

        // Act
        var result = await _sut.GetBookingConfirmation(bookingReference);

        // Assert
        result.Should().NotBeNull();
        var resultBytes = await ReadAllBytesAsync(result);
        resultBytes.Should().Equal(expectedPdfBytes);
    }

    [Theory]
    [MemberData(nameof(BookingReferenceTestData))]
    public async Task GetBookingConfirmation_ValidInput_CallsApiWithCorrectEndpoint(string bookingReference)
    {
        // Arrange
        var base64Content = Convert.ToBase64String(new byte[] { 1, 2, 3 });
        var base64Stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(base64Content));
        var expectedEndpoint = $"{_ccpSettings.CcpUrl.AbsoluteUri.TrimEnd('/')}/{_ccpSettings.DocumentRetrievalEndpoint}/{bookingReference}";
        
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ReturnsAsync(base64Stream);

        // Act
        await _sut.GetBookingConfirmation(bookingReference);

        // Assert
        _apiServiceMock.Verify(x => x.GetResponseStreamAsync(
            It.Is<GetDocumentRequest>(req => req.Endpoint.ToString() == expectedEndpoint)), 
            Times.Once);
    }

    [Fact]
    public async Task GetBookingConfirmation_ApiServiceThrowsHttpRequestException_PropagatesException()
    {
        // Arrange
        var expectedException = new HttpRequestException("Network error occurred");
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(expectedException);

        // Act
        var action = async () => await _sut.GetBookingConfirmation("ERROR123");

        // Assert
        await action.Should().ThrowAsync<HttpRequestException>();
    }

    [Fact]
    public async Task GetBookingConfirmation_ApiServiceThrowsTaskCanceledException_PropagatesException()
    {
        // Arrange
        var expectedException = new TaskCanceledException("Request timeout");
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(expectedException);

        // Act
        var action = async () => await _sut.GetBookingConfirmation("TIMEOUT456");

        // Assert
        await action.Should().ThrowAsync<TaskCanceledException>();
    }

    [Fact]
    public async Task GetBookingConfirmation_ApiServiceThrowsErrorResponseException_WrapsInApiException()
    {
        // Arrange
        var innerException = new ErrorResponseException(null, "Document not found", null, null);
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(innerException);

        // Act
        var action = async () => await _sut.GetBookingConfirmation("NOTFOUND123");

        // Assert
        var exception = await action.Should().ThrowAsync<ApiException>();
        exception.Which.Code.Should().Be(ApiExceptionCodes.DfloGetDocumentsError);
        exception.Which.InnerException.Should().BeSameAs(innerException);
    }

    // ── GetVatInvoicePdf ────────────────────────────────────────────────────────

    [Theory]
    [MemberData(nameof(BookingReferenceTestData))]
    public async Task GetVatInvoicePdf_ValidInput_ReturnsStream(string bookingReference)
    {
        // Arrange
        var expectedPdfBytes = new byte[] { 1, 2, 3, 4, 5 };
        var base64Content = Convert.ToBase64String(expectedPdfBytes);
        var base64Stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(base64Content));

        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ReturnsAsync(base64Stream);

        // Act
        var result = await _sut.GetVatInvoicePdf(bookingReference);

        // Assert
        result.Should().NotBeNull();
        var resultBytes = await ReadAllBytesAsync(result);
        resultBytes.Should().Equal(expectedPdfBytes);
    }

    [Theory]
    [MemberData(nameof(BookingReferenceTestData))]
    public async Task GetVatInvoicePdf_ValidInput_CallsApiWithCorrectEndpoint(string bookingReference)
    {
        // Arrange
        var base64Content = Convert.ToBase64String(new byte[] { 1, 2, 3 });
        var base64Stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(base64Content));
        var expectedEndpoint = $"{_ccpSettings.CcpUrl.AbsoluteUri.TrimEnd('/')}/{_ccpSettings.VatInvoicePdfEndpoint}/{bookingReference}";

        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ReturnsAsync(base64Stream);

        // Act
        await _sut.GetVatInvoicePdf(bookingReference);

        // Assert
        _apiServiceMock.Verify(x => x.GetResponseStreamAsync(
            It.Is<GetDocumentRequest>(req => req.Endpoint.ToString() == expectedEndpoint)),
            Times.Once);
    }

    [Fact]
    public async Task GetVatInvoicePdf_ApiServiceThrowsHttpRequestException_PropagatesException()
    {
        // Arrange
        var expectedException = new HttpRequestException("Network error occurred");
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(expectedException);

        // Act
        var action = async () => await _sut.GetVatInvoicePdf("ERROR123");

        // Assert
        await action.Should().ThrowAsync<HttpRequestException>();
    }

    [Fact]
    public async Task GetVatInvoicePdf_ApiServiceThrowsTaskCanceledException_PropagatesException()
    {
        // Arrange
        var expectedException = new TaskCanceledException("Request timeout");
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(expectedException);

        // Act
        var action = async () => await _sut.GetVatInvoicePdf("TIMEOUT456");

        // Assert
        await action.Should().ThrowAsync<TaskCanceledException>();
    }

    [Fact]
    public async Task GetVatInvoicePdf_ApiServiceThrowsErrorResponseException_WrapsInApiException()
    {
        // Arrange
        var innerException = new ErrorResponseException(null, "VAT invoice not found", null, null);
        _apiServiceMock.Setup(x => x.GetResponseStreamAsync(
                It.IsAny<GetDocumentRequest>()))
            .ThrowsAsync(innerException);

        // Act
        var action = async () => await _sut.GetVatInvoicePdf("NOTFOUND456");

        // Assert
        var exception = await action.Should().ThrowAsync<ApiException>();
        exception.Which.Code.Should().Be(ApiExceptionCodes.DfloGetDocumentsError);
        exception.Which.InnerException.Should().BeSameAs(innerException);
    }

    private static async Task<byte[]> ReadAllBytesAsync(Stream stream)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer);
        return buffer.ToArray();
    }
}
