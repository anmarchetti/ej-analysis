using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Models;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Moq;
using Xunit;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Adapter;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Tests.Adapter;

public class BoardUpgradeAdapterTests
{
    private readonly Mock<IApiService> _apiServiceMock;

    private readonly LambdaSettings _settings;

    private readonly BoardUpgradeEskelAdapter _sut;

    public BoardUpgradeAdapterTests()
    {
        _apiServiceMock = new();
        _settings = new()
        {
            EskelUri = new Uri("https://test.endpoint:1234"),
            EskelRequestTimeoutInSeconds = 0 // equivalent to unset, due to non-nullable type
        };
        Mock<ILogger<BoardUpgradeEskelAdapter>> loggerMock = new ();
        _sut = new BoardUpgradeEskelAdapter(
            _apiServiceMock.Object,
            loggerMock.Object,
            Options.Create(_settings)
        );
    }

    [Fact]
    public async Task GetAll_ExceptionGetsLogged_AndThrown()
    {
        // Arrange
        _apiServiceMock.Setup(
            mock =>
            mock.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(It.IsAny<BoardUpgradeRequest>())
        ).ThrowsAsync(new InvalidOperationException());

        // Act
        var action = async () => await _sut.GetAll();

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetAll_WithoutConfiguredTimeout_GetsAll()
    {
        // Arrange
        var returnData = new List<BoardUpgradeModel>()
        {
            new BoardUpgradeModel(), new BoardUpgradeModel(),
        };
        _apiServiceMock.Setup(
            mock =>
            mock.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(It.IsAny<BoardUpgradeRequest>())
        ).ReturnsAsync(new BoardUpgradeResponse()
        {
            Payload = new()
            {
                Body = returnData.ToArray(),
            }
        });

        // Act
        var result = await _sut.GetAll();
        var upgrades = result as BoardUpgradeModel[] ?? result.ToArray();

        // Assert
        upgrades.Should().NotBeNull();
        upgrades.Should().HaveCount(returnData.Count);
        _apiServiceMock.Verify(
            mock => 
                mock.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(It.Is<BoardUpgradeRequest>(param => 
                    param.Timeout == null)
            ), 
            Times.Once
        );
    }

    [Fact]
    public async Task GetAll_WithConfiguredTimeout_GetsAll()
    {
        // Arrange
        _settings.EskelRequestTimeoutInSeconds = 123;

        var returnData = new List<BoardUpgradeModel>()
        {
            new BoardUpgradeModel(), new BoardUpgradeModel(),
        };
        _apiServiceMock.Setup(
            mock =>
                mock.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(It.IsAny<BoardUpgradeRequest>())
        ).ReturnsAsync(new BoardUpgradeResponse()
        {
            Payload = new()
            {
                Body = returnData.ToArray(),
            }
        });

        // Act
        var result = await _sut.GetAll();
        var upgrades = result as BoardUpgradeModel[] ?? result.ToArray();

        // Assert
        upgrades.Should().NotBeNull();
        upgrades.Should().HaveCount(returnData.Count);
        _apiServiceMock.Verify(
            mock =>
                mock.GetResponseContentAsync<BoardUpgradeRequest, BoardUpgradeResponse>(It.Is<BoardUpgradeRequest>(param =>
                    param.Timeout.HasValue && (int)param.Timeout.Value.TotalSeconds == _settings.EskelRequestTimeoutInSeconds)
                ),
            Times.Once
        );
    }
}
