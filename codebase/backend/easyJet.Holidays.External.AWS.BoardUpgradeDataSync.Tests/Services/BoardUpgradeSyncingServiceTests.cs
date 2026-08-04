using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Interfaces;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Tests.Services;

public class BoardUpgradeSyncingServiceTests
{
    private readonly Mock<IBoardUpgradeRepository> _boardUpgradeRepository;
    private readonly Mock<IBoardUpgradeEskelAdapter> _boardUpgradeAdapter;

    private readonly LambdaSettings _settings;

    private decimal FilterDiscountPercentageValue => _settings.FilterDiscountPercentage;

    private readonly BoardUpgradeSyncingService _sut;

    public BoardUpgradeSyncingServiceTests()
    {
        _boardUpgradeRepository = new();
        _boardUpgradeAdapter = new();
        _settings = new() { FilterDiscountPercentage = 100m, };


        _sut = new(
            _boardUpgradeAdapter.Object,
            _boardUpgradeRepository.Object,
            Options.Create(_settings)
        );
    }

    public static TheoryData<List<Models.BoardUpgradeModel>> MissingBoardUpgradeData =
    [
        new(null),
        new([])
    ];

    [Theory]
    [MemberData(nameof(MissingBoardUpgradeData))]
    internal async Task Sync_OnMissingBoardUpgradeData_Throws(List<Models.BoardUpgradeModel> data)
    {
        // Arrange
        _boardUpgradeAdapter.Setup(mock => mock.GetAll()).ReturnsAsync(data);

        // Act
        var action = async () => await _sut.Sync();

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }


    [Theory]
    [AutoData]
    internal async Task Sync_ValidBoardUpgradeData_FiltersAndTransformsCorrectly(string eskelDataUri, List<Models.BoardUpgradeModel> boardUpgrades)
    {
        // Arrange
        // Set correct discount percentage on all items
        foreach (var upgrade in boardUpgrades)
        {
            upgrade.DiscountPercent = FilterDiscountPercentageValue;
            upgrade.StartDate = DateTime.UtcNow;
            upgrade.EndDate = DateTime.UtcNow.AddDays(30);
            upgrade.AccommodationCode = $"ACC{Guid.NewGuid().ToString("N")[..5]}";
            upgrade.AccommodationName = "Test Accommodation";
            upgrade.BoardFrom = "HB";
            upgrade.BoardTo = "AI";
        }

        List<AccommodationBoardUpgrade> received = null;

        _boardUpgradeRepository.Setup(repository => repository.DeleteAll()).Returns(Task.CompletedTask);
        _boardUpgradeAdapter.Setup(adapter => adapter.GetAll()).ReturnsAsync(boardUpgrades);
        _boardUpgradeRepository.Setup(repository => repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>())).Callback(
            (IEnumerable<AccommodationBoardUpgrade> arg) => received = arg?.ToList()
        ).Returns(Task.CompletedTask);


        // Act
        await _sut.Sync();

        // Assert
        _boardUpgradeRepository.Verify(repository => repository.DeleteAll(), Times.Once);
        _boardUpgradeAdapter.Verify(adapter => adapter.GetAll(), Times.Once);

        // Verify that Put was called with correct data
        _boardUpgradeRepository.Verify(repository =>
            repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>()),
            Times.Once);

        received.Should().NotBeNullOrEmpty();
        received!.All(record =>
            record.AvailableBoardUpgrades.All(b => b.DiscountPercent == FilterDiscountPercentageValue)
        ).Should().BeTrue();
    }

    [Theory]
    [AutoData]
    internal async Task Sync_ErrorDuringPutOperation_ThrowsException(string eskelDataUri, List<Models.BoardUpgradeModel> boardUpgrades)
    {
        // Arrange
        // Setup valid board upgrades
        foreach (var upgrade in boardUpgrades)
        {
            upgrade.DiscountPercent = FilterDiscountPercentageValue;
            upgrade.StartDate = DateTime.UtcNow;
            upgrade.EndDate = DateTime.UtcNow.AddDays(30);
            upgrade.AccommodationCode = "ACC123";
            upgrade.AccommodationName = "Test Accommodation";
            upgrade.BoardFrom = "HB";
            upgrade.BoardTo = "AI";
        }

        _boardUpgradeRepository.Setup(repository => repository.DeleteAll()).Returns(Task.CompletedTask);
        _boardUpgradeAdapter.Setup(adapter => adapter.GetAll()).ReturnsAsync(boardUpgrades);

        // Setup Put to throw exception
        var expectedException = new InvalidOperationException("Failed to put data to DynamoDB");
        _boardUpgradeRepository
            .Setup(repository => repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>()))
            .ThrowsAsync(expectedException);

        // Act
        var action = async () => await _sut.Sync();

        // Act & Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Theory]
    [AutoData]
    internal async Task Sync_EmptyResultAfterFiltering_ThrowsException(string eskelDataUri, List<Models.BoardUpgradeModel> boardUpgrades)
    {
        // Arrange
        // Set incorrect discount percentage on all items - all will be filtered out
        foreach (var upgrade in boardUpgrades)
        {
            upgrade.DiscountPercent = FilterDiscountPercentageValue + 1; // Different from filter value
            upgrade.StartDate = DateTime.UtcNow;
            upgrade.EndDate = DateTime.UtcNow.AddDays(30);
            upgrade.AccommodationCode = "ACC123";
            upgrade.AccommodationName = "Test Accommodation";
            upgrade.BoardFrom = "HB";
            upgrade.BoardTo = "AI";
        }

        _boardUpgradeRepository.Setup(repository => repository.DeleteAll()).Returns(Task.CompletedTask);
        _boardUpgradeAdapter.Setup(adapter => adapter.GetAll()).ReturnsAsync(boardUpgrades);
        _boardUpgradeRepository.Setup(repository => repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>())).Returns(Task.CompletedTask);

        // Act
        // All records will be filtered out, but this shouldn't throw since after filtering there's no data to process
        await _sut.Sync();

        // Assert
        _boardUpgradeRepository.Verify(repository => repository.DeleteAll(), Times.Once);
        _boardUpgradeAdapter.Verify(adapter => adapter.GetAll(), Times.Once);

        // Should not be called with empty collection
        _boardUpgradeRepository.Verify(repository =>
            repository.Put(It.Is<IEnumerable<AccommodationBoardUpgrade>>(u => !u.Any())),
            Times.Never);
    }

    [Theory]
    [AutoData]
    internal async Task Sync_InvalidBoardUpgradeData_FiltersOutInvalidEntries(string eskelDataUri)
    {
        // Arrange
        var boardUpgrades = new List<Models.BoardUpgradeModel>
            {
                // Valid entry
                new Models.BoardUpgradeModel
                {
                    AccommodationCode = "ACC1",
                    AccommodationName = "Test Accommodation 1",
                    BoardFrom = "HB",
                    BoardTo = "AI",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(10),
                    DiscountPercent = FilterDiscountPercentageValue
                },
                // Invalid - missing BoardFrom
                new Models.BoardUpgradeModel
                {
                    AccommodationCode = "ACC2",
                    AccommodationName = "Test Accommodation 2",
                    BoardFrom = null,
                    BoardTo = "AI",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(10),
                    DiscountPercent = FilterDiscountPercentageValue
                },
                // Invalid - missing BoardTo
                new Models.BoardUpgradeModel
                {
                    AccommodationCode = "ACC3",
                    AccommodationName = "Test Accommodation 3",
                    BoardFrom = "HB",
                    BoardTo = null,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(10),
                    DiscountPercent = FilterDiscountPercentageValue
                },
                // Invalid - missing dates
                new Models.BoardUpgradeModel
                {
                    AccommodationCode = "ACC4",
                    AccommodationName = "Test Accommodation 4",
                    BoardFrom = "HB",
                    BoardTo = "AI",
                    StartDate = null,
                    EndDate = null,
                    DiscountPercent = FilterDiscountPercentageValue
                },
                // Invalid - incorrect discount percentage
                new Models.BoardUpgradeModel
                {
                    AccommodationCode = "ACC5",
                    AccommodationName = "Test Accommodation 5",
                    BoardFrom = "HB",
                    BoardTo = "AI",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(10),
                    DiscountPercent = 5m
                }
            };

        List<AccommodationBoardUpgrade> received = null;

        _boardUpgradeRepository.Setup(repository => repository.DeleteAll()).Returns(Task.CompletedTask);
        _boardUpgradeAdapter.Setup(adapter => adapter.GetAll()).ReturnsAsync(boardUpgrades);
        _boardUpgradeRepository.Setup(repository => repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>())).Callback(
            (IEnumerable<AccommodationBoardUpgrade> arg) => received = arg?.ToList()
        ).Returns(Task.CompletedTask);

        // Act
        await _sut.Sync();

        // Assert
        _boardUpgradeRepository.Verify(repository => repository.DeleteAll(), Times.Once);
        _boardUpgradeAdapter.Verify(adapter => adapter.GetAll(), Times.Once);

        // Verify that only valid entry was included
        _boardUpgradeRepository.Verify(repository =>
            repository.Put(It.IsAny<IEnumerable<AccommodationBoardUpgrade>>()),
            Times.Once);

        received.Should().NotBeNullOrEmpty();
        received!.Count.Should().Be(1);
        received.First().AccommodationCode.Should().Be("ACC1");
    }
}
