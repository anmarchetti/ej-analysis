using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.External.AWS.Services.BoardUpgrade;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.BoardUpgrade;

public class BoardUpgradeServiceTests
{
    private readonly Mock<IBoardUpgradeRepository> _boardUpgradeRepository = new();
    private readonly BoardUpgradeService _sut;

    public BoardUpgradeServiceTests()
    {
        _sut = new BoardUpgradeService(_boardUpgradeRepository.Object);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OffersNull_DoesNothing()
    {
        await _sut.EnrichAccommodationWithBoardUpgradeInfo((IEnumerable<Offer>)null!);
        _boardUpgradeRepository.Verify(x => x.GetAll(), Times.Never);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OffersEmpty_DoesNothing()
    {
        await _sut.EnrichAccommodationWithBoardUpgradeInfo(Array.Empty<Offer>());
        _boardUpgradeRepository.Verify(x => x.GetAll(), Times.Never);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OfferWithNoUpgrades_SetsHasFreeBoardUpdateFalse()
    {
        List<AccommodationBoardUpgrade> upgrades = [new AccommodationBoardUpgrade { AccommodationCode = "A1", AvailableBoardUpgrades = [new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade { BoardFrom = "HB" }] }];
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }
                }
            },
            Date = DateTime.UtcNow,
            Stay = 5
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync(upgrades);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.False(offer.HasFreeBoardUpdate ?? false);
        Assert.False(offer.HasDiscountedBoardUpgrade);
        Assert.All(offer.Accom.Unit, u => Assert.Null(u.IsFreeBoardUpgrade));
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OfferWithMatchingUpgrade_SetsHasFreeBoardUpdateTrue()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }
                }
            },
            Date = today,
            Stay = 2
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI",
            DiscountPercent = 100
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.True(offer.HasFreeBoardUpdate ?? false);
        Assert.False(offer.HasDiscountedBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OfferWithMultipleUnits_OnlySetsRelevantUnit()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" },
                    new Unit { BoardType = new BoardType { Code = "HB" }, Board = "HB" }
                }
            },
            Date = today,
            Stay = 2
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI",
            DiscountPercent = 100
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.True(offer.HasFreeBoardUpdate ?? false);
        Assert.False(offer.HasDiscountedBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_OfferWithNoDateOrStay_DoesNotEnrich()
    {
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }
                }
            },
            // Date and Stay are null
        };
        
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> 
            { 
                new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade 
                { 
                    BoardFrom = "BB",
                    BoardTo = "AI" 
                } 
            }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.Null(offer.HasFreeBoardUpdate);
        Assert.False(offer.HasDiscountedBoardUpgrade);
        Assert.Null(offer.Accom.Unit[0].IsFreeBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_NullOrEmptyUpgrades_DoesNotEnrich()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }
                }
            },
            Date = today,
            Stay = 2
        };
        
        // Return null from repository
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync((IEnumerable<AccommodationBoardUpgrade>)null!);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.Null(offer.HasFreeBoardUpdate);
        Assert.False(offer.HasDiscountedBoardUpgrade);
        
        // Return empty list from repository
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.Null(offer.HasFreeBoardUpdate);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_BookingDateOutOfRange_DoesNotEnrich()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }
                }
            },
            Date = today,
            Stay = 2
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            // Booking date range is in the past
            BookFromDate = today.AddDays(-10),
            BookToDate = today.AddDays(-5),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI"
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.False(offer.HasFreeBoardUpdate ?? false);
        Assert.False(offer.HasDiscountedBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StayDateOutOfRange_DoesNotEnrich()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit =[new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" }]
            },
            Date = today,
            Stay = 10 // Stay is 10 days
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            // Stay period is too short (only 2 days)
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI"
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.False(offer.HasFreeBoardUpdate ?? false);
        Assert.False(offer.HasDiscountedBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_InvalidDate_DoesNothing()
    {
        var result = new RoomVariantsSearchResponse { AltBoards = new List<AltBoardType>() { new AltBoardType { Code = "AI" } } };
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", "notadate", new List<int> { 1 }, "BB", result);
        _boardUpgradeRepository.Verify(x => x.GetAll(), Times.Never);
        Assert.False(result.AltBoards[0].IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_DurationEmpty_DoesNothing()
    {
        var result = new RoomVariantsSearchResponse { AltBoards = new List<AltBoardType>() { new AltBoardType { Code = "AI" } } };
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int>(), "BB", result);
        _boardUpgradeRepository.Verify(x => x.GetAll(), Times.Never);
        Assert.False(result.AltBoards[0].IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_NoUpgrades_DoesNothing()
    {
        var result = new RoomVariantsSearchResponse { AltBoards = new List<AltBoardType>() { new AltBoardType { Code = "AI" } } };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([]);
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 1 }, "BB", result);
        Assert.False(result.AltBoards[0].IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_NoMatchingAccommodation_DoesNothing()
    {
        var result = new RoomVariantsSearchResponse { AltBoards = new List<AltBoardType>() { new AltBoardType { Code = "AI" } } };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A2", // Different from requested "A1"
            AvailableBoardUpgrades = [ 
                new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade { 
                    BoardFrom = "BB", 
                    BoardTo = "AI" 
                } 
            ]
        }]);
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 1 }, "BB", result);
        Assert.False(result.AltBoards[0].IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_MatchingUpgrade_SetsIsFreeBoardUpgrade()
    {
        var today = DateTime.UtcNow.Date;
        var altBoard = new AltBoardType { Code = "AI" };
        var result = new RoomVariantsSearchResponse
        {
            AltBoards = new List<AltBoardType> { altBoard }
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-2),
            BookToDate = today.AddDays(2),
            StartDate = today.AddDays(-5),
            EndDate = today.AddDays(5),
            BoardFrom = "BB",
            BoardTo = "AI",
            DiscountPercent = 100
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",   
            AvailableBoardUpgrades = [upgrade]
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", today.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 1 }, "BB", result);

        Assert.True(altBoard.IsFreeBoardUpgrade);
        Assert.Equal(100, altBoard.DiscountPercent);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_MultipleDurations_UsesFirstDuration()
    {
        var today = DateTime.UtcNow.Date;
        var altBoard = new AltBoardType { Code = "AI" };
        var result = new RoomVariantsSearchResponse
        {
            AltBoards = new List<AltBoardType> { altBoard }
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-2),
            BookToDate = today.AddDays(2),
            StartDate = today.AddDays(-3),
            EndDate = today.AddDays(3),
            BoardFrom = "BB",
            BoardTo = "AI",
            DiscountPercent = 100
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",   
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        // Multiple durations passed but should only use the first one (2)
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", today.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 2, 5, 7 }, "BB", result);

        Assert.True(altBoard.IsFreeBoardUpgrade);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_BoardTypeNotMatching_NoUpgrade()
    {
        var today = DateTime.UtcNow.Date;
        var altBoard = new AltBoardType { Code = "AI" };
        var result = new RoomVariantsSearchResponse
        {
            AltBoards = new List<AltBoardType> { altBoard }
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI"
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",   
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        // Using "HB" as board type which does not match any upgrades
        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", today.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 2 }, "HB", result);

        Assert.False(altBoard.IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_StringOverload_AltBoardNotMatching_NoUpgrade()
    {
        var today = DateTime.UtcNow.Date;
        var altBoard = new AltBoardType { Code = "HB" };  // Doesn't match BoardTo="AI"
        var result = new RoomVariantsSearchResponse
        {
            AltBoards = new List<AltBoardType> { altBoard }
        };
        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI"
        };
        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",   
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo("A1", today.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), new List<int> { 2 }, "BB", result);

        Assert.False(altBoard.IsFreeBoardUpgrade ?? false);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_WhenResultArgumentIsNull_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => 
            _sut.EnrichAccommodationWithBoardUpgradeInfo(
                "A1", 
                DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), 
                new List<int> { 1 }, 
                "BB", 
                null!));
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_DiscountedUpgrade_SetsHasDiscountedBoardUpgrade()
    {
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" },
                    new Unit { BoardType = new BoardType { Code = "AI" }, Board = "AI" }
                }
            },
            Date = today,
            Stay = 2
        };

        var upgrade = new Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade
        {
            BookFromDate = today.AddDays(-1),
            BookToDate = today.AddDays(1),
            StartDate = today,
            EndDate = today.AddDays(2),
            BoardFrom = "BB",
            BoardTo = "AI",
            DiscountPercent = 50
        };

        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade> { upgrade }
        }]);

        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        Assert.False(offer.HasFreeBoardUpdate ?? false);
        Assert.True(offer.HasDiscountedBoardUpgrade);
        Assert.False(offer.Accom.Unit[1].IsFreeBoardUpgrade);
        Assert.Equal(50, offer.Accom.Unit[1].BoardDiscountPercentage);
    }

    [Fact]
    public async Task EnrichWithAccommodationBoardUpgradeInfo_SetsIsFreeBoardUpgradeCorrectlyForEachUnit()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var offer = new Offer
        {
            Accom = new Accom
            {
                Code = "A1",
                Unit = new List<Unit>
                {
                    new Unit { BoardType = new BoardType { Code = "BB" }, Board = "BB" },  // Original board
                    new Unit { BoardType = new BoardType { Code = "HB" }, Board = "HB" },  // Not an upgrade
                    new Unit { BoardType = new BoardType { Code = "AI" }, Board = "AI" },  // Is an upgrade
                    new Unit { BoardType = new BoardType { Code = "FB" }, Board = "FB" }   // Not an upgrade
                }
            },
            Date = today,
            Stay = 2
        };

        var upgrades = new List<Api.Domain.Data.DynamoDB.BoardUpgrades.BoardUpgrade>
        {
            new()
            {
                BookFromDate = today.AddDays(-1),
                BookToDate = today.AddDays(1),
                StartDate = today,
                EndDate = today.AddDays(2),
                BoardFrom = "BB",
                BoardTo = "AI",  // Only AI is a free upgrade from BB
                DiscountPercent = 100
            }
        };

        _boardUpgradeRepository.Setup(x => x.GetAll()).ReturnsAsync([new AccommodationBoardUpgrade
        {
            AccommodationCode = "A1",
            AvailableBoardUpgrades = upgrades
        }]);

        // Act
        await _sut.EnrichAccommodationWithBoardUpgradeInfo([offer]);

        // Assert
        Assert.True(offer.HasFreeBoardUpdate);
        Assert.False(offer.HasDiscountedBoardUpgrade);
        
        // Original board (not an upgrade destination)
        Assert.Null(offer.Accom.Unit[0].IsFreeBoardUpgrade);
        
        // Not a matching upgrade destination
        Assert.Null(offer.Accom.Unit[1].IsFreeBoardUpgrade);
        
        // Matching upgrade destination (AI is BoardTo)
        Assert.True(offer.Accom.Unit[2].IsFreeBoardUpgrade);
        Assert.Equal(100, offer.Accom.Unit[2].BoardDiscountPercentage);
        
        // Not a matching upgrade destination
        Assert.Null(offer.Accom.Unit[3].IsFreeBoardUpgrade);
    }
}
