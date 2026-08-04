using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.HolidayExtras.Models;
using easyJet.Holidays.External.HolidayExtras.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.HolidayExtras.Tests;

public class HolidayExtrasServiceTests
{
    private readonly HolidayExtrasService _holidayExtrasService;
    private readonly Mock<IApiService> _apiServiceMock;
    private readonly Mock<ILogger<HolidayExtrasService>> _loggerMock;
    private readonly HolidayExtrasSettings _testSettings;


    public HolidayExtrasServiceTests()
    {
        _apiServiceMock = new Mock<IApiService>();
        _loggerMock = new Mock<ILogger<HolidayExtrasService>>();
        _testSettings = new HolidayExtrasSettings
        {
            BaseUrl = new Uri("https://fake-api-url"),
            ProductEndpoint = "product-endpoint",
            Key = "myTestKey",
            ImagesBaseUrl = new Uri("https://fake-images-url"),
        };

        _holidayExtrasService =
            new HolidayExtrasService(_apiServiceMock.Object, _testSettings, _loggerMock.Object);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ReturnsDescription()
    {
        // Arrange

        const string prodCode = "FRA0";

        var expectedResponse = new HolidayExtrasProductsResponse
        {
            Payload = new JsonApiPayload<AirportParkingSearchResponse>
            {
                Body = new AirportParkingSearchResponse
                {
                    HolidayExtrasProducts =
                        new HolidayExtrasProducts
                        {
                            Products =
                                [new HolidayExtrasProduct { Description = "Parking long description" }],
                            Attributes = new HolidayExtrasApiResponseAttributes { Result = "OK" }
                        }
                }
            }
        };

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(expectedResponse);

        // Act

        var response = await _holidayExtrasService.GetHolidayExtrasProduct(prodCode);

        // Assert

        Assert.Single(response.Products);
        Assert.Equal(expectedResponse.Payload.Body.HolidayExtrasProducts.Products.First().Description,
            response.Products.First().Description);
        Assert.Equal(expectedResponse.Payload.Body.HolidayExtrasProducts.Attributes.Result, response.Attributes.Result);
        Assert.Null(response.Error);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ReturnsEmpty_WhenCodeDoesntExist()
    {
        // Arrange

        const string prodCode = "NonExistent";

        var expectedResponse = new HolidayExtrasProductsResponse
        {
            Payload = new JsonApiPayload<AirportParkingSearchResponse>
            {
                Body = new AirportParkingSearchResponse
                {
                    HolidayExtrasProducts =
                        new HolidayExtrasProducts
                        {
                            Error = new HolidayExtrasApiError
                            {
                                Code = "NoRows", Message = "Found nothing matching"
                            },
                            Attributes = new HolidayExtrasApiResponseAttributes { Result = "ERROR" }
                        }
                }
            }
        };

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(expectedResponse);

        // Act

        var response = await _holidayExtrasService.GetHolidayExtrasProduct(prodCode);

        // Assert

        Assert.Equal(expectedResponse.Payload.Body.HolidayExtrasProducts.Error.Code, response.Error?.Code);
        Assert.Equal(expectedResponse.Payload.Body.HolidayExtrasProducts.Error.Message, response.Error?.Message);
        Assert.Equal(expectedResponse.Payload.Body.HolidayExtrasProducts.Attributes.Result, response.Attributes.Result);
        Assert.Null(response.Products);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ReturnsNull_WhenResponseContentIsNull()
    {
        // Arrange

        const string prodCode = "NonExistent";

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync((HolidayExtrasProductsResponse)null!);

        // Act

        HolidayExtrasProducts? response = await _holidayExtrasService.GetHolidayExtrasProduct(prodCode);

        // Assert

        Assert.Null(response);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ReturnsNull_WhenResponsePayloadIsNull()
    {
        // Arrange

        const string prodCode = "NonExistent";

        HolidayExtrasProductsResponse expectedResponse = new() { Payload = null };

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(expectedResponse);

        // Act

        var response = await _holidayExtrasService.GetHolidayExtrasProduct(prodCode);

        // Assert

        Assert.Null(response);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ThrowsException_WhenProductEndpointSettingIsNull()
    {
        // Arrange
        const string prodCode = "NonExistent";
        _testSettings.ProductEndpoint = null!;

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(It.IsAny<HolidayExtrasProductsResponse>());

        // Act
        var exception =
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _holidayExtrasService.GetHolidayExtrasProduct(prodCode));

        // Assert

        Assert.NotNull(exception);
        Assert.Contains("Value cannot be null. (Parameter 'path1')", exception.Message,
            StringComparison.InvariantCulture);
    }

    [Fact]
    public async Task CallHolidayExtrasEndpoint_ThrowsException_WhenBaseUrlSettingIsNull()
    {
        // Arrange
        const string prodCode = "NonExistent";
        _testSettings.BaseUrl = null!;

        _apiServiceMock
            .Setup(x =>
                x.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(It.IsAny<HolidayExtrasProductsResponse>());

        // Act
        var exception =
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _holidayExtrasService.GetHolidayExtrasProduct(prodCode));

        // Assert

        Assert.NotNull(exception);
        Assert.Contains("Value cannot be null. (Parameter 'baseUri')", exception.Message,
            StringComparison.InvariantCulture);
    }

    [Fact]
    public void GetHolidayExtrasImageBaseUrl_ReturnsSettingsValue()
    {
        // Arrange

        // Act

        Uri response = _holidayExtrasService.GetImagesBaseUrl();

        // Assert

        Assert.Equal(_testSettings.ImagesBaseUrl, response);
    }

    [Fact]
    public async Task GetHolidayExtrasProduct_ShouldCallApiServiceWithTokenInQueryString()
    {
        // Arrange
        const string prodCode = "A76A";
        _apiServiceMock
            .Setup(service => service
                .GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                    It.IsAny<HolidayExtrasRequestWithKeyAndToken>()))
            .ReturnsAsync(It.IsAny<HolidayExtrasProductsResponse>());

        // Act
        _ = await _holidayExtrasService.GetHolidayExtrasProduct(prodCode);

        // Assert

        _apiServiceMock.Verify(service =>
            service.GetResponseContentAsync<HolidayExtrasRequestWithKeyAndToken, HolidayExtrasProductsResponse>(
                It.Is<HolidayExtrasRequestWithKeyAndToken>(r => r.QueryParams.Contains("token"))), Times.Once);
    }
}