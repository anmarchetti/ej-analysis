using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class FlightExtraCacheServiceTests
{
    private readonly Mock<IAWSDbRepository<FlightExtraCache>> _mockRepo = new();
    private readonly Mock<ILogger<FlightExtraCache>> _mockLogger = new();
    private readonly AwsSettings _awsSettings = new() { TTL = new AwsSettingsTTL { FlightExtraCacheInSec = 300 } };
    private IFlightExtraCacheService _service;

    public FlightExtraCacheServiceTests()
    {
        _service = new FlightExtraCacheService(_mockRepo.Object, _mockLogger.Object, Options.Create(_awsSettings));
    }

    [Fact]
    public async Task GetFlightExtras_WhenCacheIsUpToDate_ShouldReturnCachedExtras()
    {
        // Arrange
        var flights = Array.Empty<FlightId>();
        var fetchFunction = () => Task.FromResult(Array.Empty<FlightExtraCategoryList>() as IList<FlightExtraCategoryList>);
        var cachedExtras = new[] { new FlightExtraCategoryList() };

        _mockRepo
            .Setup(repo => repo.GetAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(cachedExtras.Select(extra => new FlightExtraCache { Extra = extra, TTL = DateTime.UtcNow.AddSeconds(_awsSettings.TTL.FlightExtraCacheInSec) }));

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: false);

        // Assert
        result.Should().BeEquivalentTo(cachedExtras);
    }

    [Fact]
    public async Task GetFlightExtras_WhenForceFetchIsTrue_ShouldFetchNewExtras()
    {
        // Arrange
        var flights = new FlightId[]
        {
            new ("","1", "_", "_", DateTime.Today)
        };
        var fetchedExtras = new[] { new FlightExtraCategoryList { FlightNumber = "1" } };
        var fetchFunction = () => Task.FromResult(fetchedExtras as IList<FlightExtraCategoryList>);

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: true);

        // Assert
        result.Should().BeEquivalentTo(fetchedExtras);
        _mockRepo.Verify(repo => repo.SaveAsync(It.IsAny<IEnumerable<FlightExtraCache>>()), Times.Once);
    }

    [Fact]
    public async Task GetFlightExtras_WhenCacheIsEmpty_ShouldFetchNewExtras()
    {
        // Arrange
        var flights = new FlightId[]
        {
            new ("_","1", "_", "_", DateTime.Today)
        };
        var fetchedExtras = new List<FlightExtraCategoryList> { new() { FlightNumber = "1" } } as IList<FlightExtraCategoryList>;
        var fetchFunction = () => Task.FromResult(fetchedExtras);

        _mockRepo
            .Setup(repo => repo.GetAsync(It.IsAny<IEnumerable<FlightId>>()))
            .ReturnsAsync(Array.Empty<FlightExtraCache>());

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: false);

        // Assert
        result.Should().BeEquivalentTo(fetchedExtras);
    }

    [Fact]
    public async Task GetFlightExtras_WhenCacheIsOutdated_ShouldFetchNewExtras()
    {
        // Arrange
        var flights = new FlightId[]
        {
            new ("_","1", "_", "_", DateTime.Today)
        };
        var fetchedExtras = new[] { new FlightExtraCategoryList { FlightNumber = "1" } };
        var fetchFunction = () => Task.FromResult(fetchedExtras as IList<FlightExtraCategoryList>);

        _mockRepo
            .Setup(repo => repo.GetAsync(It.IsAny<IEnumerable<FlightId>>()))
            .ReturnsAsync(new[] { new FlightExtraCache { Extra = new FlightExtraCategoryList(), TTL = DateTime.UtcNow.AddSeconds(-1) } });

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: false);

        // Assert
        result.Should().BeEquivalentTo(fetchedExtras);
    }

    [Fact]
    public async Task GetFlightExtras_WhenFetchFunctionThrows_ShouldLogErrorAndThrow()
    {
        // Arrange
        var flights = Array.Empty<FlightId>();
        var fetchFunction = new Func<Task<IList<FlightExtraCategoryList>>>(() => throw new Exception("Fetch error"));
        var loggerMock = new Mock<ILogger<FlightExtraCache>>();

        _service = new FlightExtraCacheService(_mockRepo.Object, loggerMock.Object, Options.Create(_awsSettings));

        // Act
        Func<Task> act = async () => await _service.GetFlightExtras(flights, fetchFunction, forceFetch: true);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Fetch error");
    }

    [Fact]
    public async Task GetFlightExtras_WhenFetchReturnNull_ShouldThrow()
    {
        // Arrange
        var flights = Array.Empty<FlightId>();
        var fetchFunction = () => Task.FromResult(null as IList<FlightExtraCategoryList>);
        var loggerMock = new Mock<ILogger<FlightExtraCache>>();

        _service = new FlightExtraCacheService(_mockRepo.Object, loggerMock.Object, Options.Create(_awsSettings));

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: true);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFlightExtras_WhenFetchReturnEmpty_ShouldNotEnrich()
    {
        // Arrange
        var flights = Array.Empty<FlightId>();
        var fetchFunction = () => Task.FromResult(Array.Empty<FlightExtraCategoryList>() as IList<FlightExtraCategoryList>);
        var loggerMock = new Mock<ILogger<FlightExtraCache>>();

        _service = new FlightExtraCacheService(_mockRepo.Object, loggerMock.Object, Options.Create(_awsSettings));

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: true);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFlightExtras_WhenRepoSaveThrows_ShouldLogErrorAndReturnFetchedExtras()
    {
        // Arrange
        var flights = new[]
        {
            new FlightId("", "1", "_", "_", DateTime.Today)
        };
        var fetchedExtras = new[] { new FlightExtraCategoryList { FlightNumber = "1" } };
        var fetchFunction = () => Task.FromResult(fetchedExtras as IList<FlightExtraCategoryList>);

        _mockRepo
            .Setup(repo => repo.SaveAsync(It.IsAny<IEnumerable<FlightExtraCache>>()))
            .ThrowsAsync(new Exception("Save error"));

        var exceptionLogged = false;
        _mockLogger
            .Setup(x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()))
            .Callback(new InvocationAction(invocation =>
            {
                exceptionLogged = true;
            }))
            .Verifiable("Logger should have been called.");

        // Act
        var result = await _service.GetFlightExtras(flights, fetchFunction, forceFetch: true);

        // Assert
        result.Should().BeEquivalentTo(fetchedExtras);
        exceptionLogged.Should().BeTrue("because an exception should have been logged.");
    }
}