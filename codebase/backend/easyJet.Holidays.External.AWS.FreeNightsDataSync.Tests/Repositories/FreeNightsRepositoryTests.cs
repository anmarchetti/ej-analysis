using easyJet.Holidays.External.AWS.FreeNightsDataSync.Models;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Repositories;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Settings;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Tests.Repositories;

public class FreeNightsRepositoryTests
{
    private readonly Mock<IApiService> _apiService;

    private readonly FreeNightsRepository _sut;

    public FreeNightsRepositoryTests()
    {
        _apiService = new();
        Mock<ILogger<FreeNightsRepository>> logger = new();
        LambdaSettings lambdaSettings = new()
        {
            EskelUri = new("https://test.endpoint:1234")
        };


        _sut = new FreeNightsRepository(
            _apiService.Object,
            logger.Object,
            Options.Create(lambdaSettings)
        );
    }

    [Fact]
    public async Task GetAll_ExceptionGetsLogged_AndThrown()
    {
        // Arrange
        _apiService.Setup(
            mock =>
                mock.GetResponseContentAsync<FreeNightsRequest, FreeNightsResponse>(It.IsAny<FreeNightsRequest>())
        ).ThrowsAsync(new InvalidOperationException());

        // Act
        var action = async () => await _sut.GetAll();

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetAll_GetsAll()
    {
        // Arrange
        var returnData = new List<FreeNight>()
        {
            new FreeNight(), new FreeNight(),
        };
        _apiService.Setup(
            mock =>
                mock.GetResponseContentAsync<FreeNightsRequest, FreeNightsResponse>(It.IsAny<FreeNightsRequest>())
        ).ReturnsAsync(new FreeNightsResponse()
        {
            Payload = new()
            {
                Body = returnData.ToArray(),
            }
        });

        // Act
        var result = await _sut.GetAll();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(returnData.Count);
        _apiService.Verify(mock => mock.GetResponseContentAsync<FreeNightsRequest, FreeNightsResponse>(It.IsAny<FreeNightsRequest>()), Times.Once);
    }
}