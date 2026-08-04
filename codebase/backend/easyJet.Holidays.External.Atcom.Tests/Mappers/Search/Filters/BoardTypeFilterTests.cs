using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Utils;
using FluentAssertions;
using Moq;
using Xunit;
using static easyJet.Holidays.External.Atcom.Tests.AtComBuilders;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class BoardTypeFilterTests
{
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly BoardTypeFilter _sut;
    private ApplyAllFiltersFunc applyAllFiltersFunc = (List<AvCacheResultOffersOfferExtended> set, Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest request) =>
            Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

    public BoardTypeFilterTests()
    {
        _referenceDataServiceMock = new Mock<IReferenceDataService>();

        _sut = new BoardTypeFilter(_referenceDataServiceMock.Object);
    }

    [Fact]
    public async Task GetOptions_NullOffers_ReturnsEmptyFilterOptions()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(async () => await _sut.GetOptions(null, null, null));
    }

    [Fact]
    public async Task GetOptions_EmptyOffers_ReturnsEmptyFilterOptions()
    {
        var result = await _sut.GetOptions(new List<AvCacheResultOffersOfferExtended>(), null, applyAllFiltersFunc);

        result.Should().NotBeNull();
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_EmptyReferenceData_ReturnsEmptyFilterOptions()
    {
        _referenceDataServiceMock.Setup(rfs => rfs.GetBoardTypes())
            .ReturnsAsync(new Dictionary<string, BoardType>());

        var result = await _sut.GetOptions(new List<AvCacheResultOffersOfferExtended>(), null, applyAllFiltersFunc);

        result.Should().NotBeNull();
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_NullBoardTypes_ReturnsEmptyFilterOptions()
    {
        _referenceDataServiceMock
            .Setup(x => x.GetBoardTypes())
            .ReturnsAsync((Dictionary<string, BoardType>)null);

        var result = await _sut.GetOptions(
            new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtended()
            },
            null,
            applyAllFiltersFunc);

        result.Should().NotBeNull();
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_EmptyBoardTypes_ReturnsEmptyFilterOptions()
    {
        _referenceDataServiceMock
            .Setup(x => x.GetBoardTypes())
            .ReturnsAsync(new Dictionary<string, BoardType>());

        var result = await _sut.GetOptions(
            new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtended()
            },
            null,
            applyAllFiltersFunc);

        result.Should().NotBeNull();
        result.Options.Should().BeEmpty();
    }

    [Theory]
    [MemberData(nameof(BoardTyperFilterTheoryData.TestData), MemberType = typeof(BoardTyperFilterTheoryData))]
    public async Task GetOptions_OffersWithBoards_ReturnsFilters(List<AvCacheResultOffersOffer> offers,
        Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest packagesSearchRequest,
        Dictionary<string, BoardType> boardTypes,
        Holidays.Api.Domain.Data.PackageOffers.FilterOptions expected)
    {
        List<AvCacheResultOffersOfferExtended> offerExtended = new();

        offers.ForEach(o =>
        {
            BoardUtils.MapAllBoards(o);
            offerExtended.Add(new AvCacheResultOffersOfferExtendedBuilder().Build(o, [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AvCacheResultOffersOfferAccomBuilder().Build())]));
        });

        applyAllFiltersFunc = (List<AvCacheResultOffersOfferExtended> set, Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest request) =>
            Task.FromResult(offerExtended);

        _referenceDataServiceMock
            .Setup(x => x.GetBoardTypes())
            .ReturnsAsync(boardTypes);

        var result = await _sut.GetOptions(offerExtended, packagesSearchRequest, applyAllFiltersFunc);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetOptions_MapsTrackingId_FromReferenceData_ForTopLevelChildBoardsAndChildren()
    {
        var offers = new List<AvCacheResultOffersOffer>
        {
            new AvCacheResultOffersOfferResponseBuilder()
                .WithAccommadation(new AtcomAccommadationResponseBuilder()
                    .WithAccommadation(accomId: "ESDO0029")
                    .WithUnit(roomBoard: "BB+")
                    .Build())
                .Build()
        };

        List<AvCacheResultOffersOfferExtended> offerExtended = new();
        offers.ForEach(o =>
        {
            BoardUtils.MapAllBoards(o);
            offerExtended.Add(new AvCacheResultOffersOfferExtendedBuilder().Build(o,
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AvCacheResultOffersOfferAccomBuilder().Build())]));
        });

        applyAllFiltersFunc = (set, _) => Task.FromResult(offerExtended);

        var boardTypes = new Dictionary<string, BoardType>
        {
            {
                "BB",
                new BoardType
                {
                    Code = "BB",
                    Name = "Parent board",
                    TrackingId = "track-parent-bb"
                }
            },
            {
                "BB+",
                new BoardType
                {
                    Code = "BB+",
                    Name = "Child board",
                    TrackingId = "track-child-bb-plus",
                    BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup { Code = "BB" }
                }
            }
        };

        _referenceDataServiceMock.Setup(x => x.GetBoardTypes()).ReturnsAsync(boardTypes);

        var result = await _sut.GetOptions(offerExtended, new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(), applyAllFiltersFunc);

        var parentOption = result.Options.Should().ContainSingle().Subject;
        parentOption.Code.Should().Be("BB");
        parentOption.TrackingId.Should().Be("track-child-bb-plus", "child branch maps TrackingId from the matched board row, not the parent row");

        parentOption.Children.Should().ContainSingle();
        parentOption.Children[0].Code.Should().Be("BB+");
        parentOption.Children[0].TrackingId.Should().Be("track-child-bb-plus");
    }

    [Fact]
    public async Task GetOptions_MapsTrackingId_ForTopLevelBoardWhenBoardGroupIsNull()
    {
        var offers = new List<AvCacheResultOffersOffer>
        {
            new AvCacheResultOffersOfferResponseBuilder()
                .WithAccommadation(new AtcomAccommadationResponseBuilder()
                    .WithAccommadation(accomId: "ESDO0029")
                    .WithUnit(roomBoard: "HB").Build())
                .Build()
        };

        List<AvCacheResultOffersOfferExtended> offerExtended = new();
        offers.ForEach(o =>
        {
            BoardUtils.MapAllBoards(o);
            offerExtended.Add(new AvCacheResultOffersOfferExtendedBuilder().Build(o,
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AvCacheResultOffersOfferAccomBuilder().Build())]));
        });

        applyAllFiltersFunc = (set, _) => Task.FromResult(offerExtended);

        var boardTypes = new Dictionary<string, BoardType>
        {
            {
                "HB",
                new BoardType
                {
                    Code = "HB",
                    Name = "Half board",
                    TrackingId = "track-hb-top-level"
                }
            }
        };

        _referenceDataServiceMock.Setup(x => x.GetBoardTypes()).ReturnsAsync(boardTypes);

        var result = await _sut.GetOptions(offerExtended, new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(), applyAllFiltersFunc);

        var option = result.Options.Should().ContainSingle().Subject;
        option.Code.Should().Be("HB");
        option.TrackingId.Should().Be("track-hb-top-level");
        option.Children.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_InitialPricePPToSetup_ReturnsNumberOfBoardsWithinPriceCriteria()
    {
        var offerWithPriceInPriceRange = new AvCacheResultOffersOfferResponseBuilder()
                .WithAltBoard([new() { Code = "HB", Price = 500 }])
                .WithAccommadation(new AtcomAccommadationResponseBuilder()
                    .WithAccommadation(accomId: "ESDO0029")
                    .WithUnit(roomBoard: "BB").Build())
                .Build();
        var offerWithInValidPrice = new AvCacheResultOffersOfferResponseBuilder()
                .WithAltBoard([new() { Code = "HB", Price = 1000 }])
               .WithAccommadation(new AtcomAccommadationResponseBuilder()
                   .WithAccommadation(accomId: "ESDO0029")
                   .WithUnit(roomBoard: "BB").Build())
               .Build();
        var offers = new List<AvCacheResultOffersOffer>
        {
            offerWithPriceInPriceRange, offerWithInValidPrice
        };

        List<AvCacheResultOffersOfferExtended> offerExtended = new();
        offers.ForEach(o =>
        {
            BoardUtils.MapAllBoards(o);
            offerExtended.Add(new AvCacheResultOffersOfferExtendedBuilder().Build(o,
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AvCacheResultOffersOfferAccomBuilder().Build())]));
        });

        applyAllFiltersFunc = (set, _) => Task.FromResult(offerExtended);

        var boardTypes = new Dictionary<string, BoardType> {{ "HB", new BoardType { Code = "HB" }}};

        _referenceDataServiceMock.Setup(x => x.GetBoardTypes()).ReturnsAsync(boardTypes);

        var result = await _sut.GetOptions(offerExtended, new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest { InitialPricePPTo = 350, Room = new List<Holidays.Api.Domain.Data.PackageOffers.RoomAllocation> { new Holidays.Api.Domain.Data.PackageOffers.RoomAllocation { Adults = 2} } }, applyAllFiltersFunc);

        var option = result.Options.Should().ContainSingle().Subject;
        option.Count.Should().Be(1);
    }

    internal class BoardTyperFilterTheoryData : TheoryData
        <List<AvCacheResultOffersOffer>, Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest, Dictionary<string, BoardType>, Holidays.Api.Domain.Data.PackageOffers.FilterOptions>

    {
        public static TheoryData<List<AvCacheResultOffersOffer>, Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest, Dictionary<string, BoardType>, Holidays.Api.Domain.Data.PackageOffers.FilterOptions> TestData() =>
            new()
            {
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB")
                                .WithUnit(roomBoard: "BB").Build())
                        .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>() { { "BB", new() { Code = "BB", Name = nameof(BoardType.Name) } } },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new Holidays.Api.Domain.Data.PackageOffers.FilterOption
                            {
                                Code = "BB",
                                Count = 1,
                                Name = nameof(BoardType.Name),
                                Children =  Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList()
                            }
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB+").Build())
                        .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "BB", new() { Code = "BB", Name = nameof(BoardType.Name) } },
                        { "BB+", new() { Code = "BB+", Name = nameof(BoardType.Name), BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup { Code = "BB" } } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new Holidays.Api.Domain.Data.PackageOffers.FilterOption
                            {
                                Code = "BB",
                                Count = 1,
                                Name = nameof(BoardType.Name),
                                Children =  new() { new() { Code = "BB+", Name = nameof(BoardType.Name) } }
                            }
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB+")
                                .WithUnit(roomBoard: "BB-").Build())
                        .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>() { { "BB+", new() } },
                    Holidays.Api.Domain.Data.PackageOffers.FilterOptions.Empty
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB+")
                                .WithUnit(roomBoard: "BB-").Build())
                        .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>() { { "HB", new() { BoardGroup = new() } } },
                    Holidays.Api.Domain.Data.PackageOffers.FilterOptions.Empty
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "FB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build(),
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest()
                    {
                        IsPricePP = false,
                        PriceFrom = 1400,
                        PriceTo = 1800
                    },
                    new Dictionary<string, BoardType>()
                    {
                        { "FB", new() { Code = "FB" } },
                        { "BB", new() { Code = "BB" } },
                        { "AI", new() { Code = "AI" } }
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 1, Code="FB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 1, Code="BB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 1, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "AI" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 2, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "AI" },new() { Code= "AI-" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI+").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 2, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "HB" },new() { Code= "AI" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "HB+").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "HB").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                        { "HB", new() { Code = "HB" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 1, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="HB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "AI" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "HB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "HB" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                        { "HB", new() { Code = "HB" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 2, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="HB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "AI", Price = 1800 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "BB", Price = 1100 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "FB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1300)
                            .WithAltBoard([new() { Code= "AI", Price = 1900 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1700)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest()
                    {
                        IsPricePP = true,
                        Room = new List<Holidays.Api.Domain.Data.PackageOffers.RoomAllocation>
                        {
                            new Holidays.Api.Domain.Data.PackageOffers.RoomAllocation { Adults = 2}
                        },
                        PriceFrom = 700,
                        PriceTo = 900

                    },
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                        { "BB", new() { Code = "BB" } },
                        { "FB", new() { Code = "FB" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 1, Code="FB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAltBoard([new() { Code= "AI", Price = 1800 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "BB", Price = 1100 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "FB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1300)
                            .WithAltBoard([new() { Code= "AI", Price = 1900 }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1700)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "AI").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest()
                     {
                        IsPricePP = false,
                        PriceFrom = 1400,
                        PriceTo = 1800
                    },
                    new Dictionary<string, BoardType>()
                    {
                        { "AI", new() { Code = "AI" } },
                        { "BB", new() { Code = "BB" } },
                        { "FB", new() { Code = "FB" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 1, Code="FB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="AI", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                },
                {
                    [
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1200)
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "FB" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "SC" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "BB").Build())
                            .Build(),
                        new AvCacheResultOffersOfferResponseBuilder()
                            .With(price: 1500)
                            .WithAltBoard([new() { Code= "SC" }])
                            .WithAccommadation(new AtcomAccommadationResponseBuilder()
                                .WithAccommadation(accomId: "ESDO0029")
                                .WithUnit(roomBoard: "FB").Build())
                            .Build()
                    ],
                    new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest(),
                    new Dictionary<string, BoardType>()
                    {
                        { "SC", new() { Code = "SC" } },
                        { "FB", new() { Code = "FB" } },
                        { "BB", new() { Code = "BB" } },
                    },
                    new Holidays.Api.Domain.Data.PackageOffers.FilterOptions()
                    {
                        Options = new()
                        {
                            new(){ Count = 3, Code="BB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="FB", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                            new(){ Count = 2, Code="SC", Children = Enumerable.Empty<Holidays.Api.Domain.Data.PackageOffers.FilterOption>().ToList() },
                        }
                    }
                }
            };
    }
}
