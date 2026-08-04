#nullable enable

using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Utils;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;
using ReferenceData = easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.External.Atcom.Tests.Utils;

public class BoardServiceTests
{
    private readonly BoardService _sut;


    public BoardServiceTests()
    {
        IOptions<AtcomSettings> options = Options.Create(new AtcomSettings { DuplicationBoardSuffix = "-" });

        _sut = new BoardService(options);
    }

    [Theory]
    [MemberData(nameof(FirstOrDefault_ReturnsAvCacheResultOffersOfferBoardOrNull_Data))]
    public void FirstOrDefaultAsync_ReturnsAvCacheResultOffersOfferBoardOrNull(string requestedBoard,
        AvCacheResultOffersOfferBoard[] alternateBoards,
        AvCacheResultOffersOfferBoard? expected)
    {
        var result = _sut.FirstOrDefaultAlternateBoard(alternateBoards, requestedBoard);

        result.Should().BeEquivalentTo(expected);
    }

    [Theory]
    [MemberData(nameof(GetBoardPrice_ReturnsPriceOrNull_Data))]
    public void GetBoardPriceAsync_ReturnsPriceOrNull(string requestedBoard,
        AvCacheResultOffersOffer avCacheResultOffersOffer,
        decimal? expected)
    {
        var result = _sut.GetBoardPrice(avCacheResultOffersOffer, requestedBoard);

        result.Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(HasRequestedBoardType_ReturnsTrueOrFalse_Data))]
    public void HasRequestedBoardType_ReturnsTrueOrFalse(string requestedBoard,
        AvCacheResultOffersOffer avCacheResultOffersOffer,
        bool expected)
    {
        var result = _sut.HasRequestedBoardType(avCacheResultOffersOffer, requestedBoard);

        result.Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(AnyAlternativeOffer_ReturnsTrueOrFalse_Data))]
    public void AnyAlternativeOfferAsync_ReturnsTrueOrFalse(string requestedBoard,
        AvCacheResultOffersOffer avCacheResultOffersOffer,
        bool expected)
    {
        var result = _sut.AnyAlternateOffer([avCacheResultOffersOffer], requestedBoard);

        result.Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(Same_ReturnsMatch_Data))]
    public void SameAsync_ReturnsMatch(string requestedBoard,
        AltBoardType[] altBoardType,
        AltBoardType expected)
    {
        var result = _sut.GetAlternateBoardByBoardCode(altBoardType, requestedBoard);

        result.Should().BeEquivalentTo(expected);
    }

    [Theory]
    [InlineData(null, null, false)]
    [InlineData("BB", "BB", true)]
    [InlineData("BB", "BB-", true)]
    public void EqualAsync(string? lhs, string? rhs, bool expected)
    {
        var boardTypes = new Dictionary<string, ReferenceData.BoardType>
            {
                { "BB", new() { Code = "BB", } },
                { "BB-", new() { Code = "BB-", BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup{Code = "BB"} } }
            };

        var result = _sut.BoardCodesAreEqual(lhs!, rhs!);

        result.Should().Be(expected);
    }


    [Theory]
    [MemberData(nameof(GetAllAlternativeBoards_ReturnsAllAlternativeBoards_Data))]
    public void GetAllAlternativeBoards_ReturnsAllAlternativeBoardsAsync(string requestedBoard,
        AvCacheResultOffersOffer[] offers,
        AvCacheResultOffersOfferBoard[] expected)
    {
        var result = _sut.GetAllAlternativeBoards(offers, requestedBoard);

        result.Should().BeEquivalentTo(expected);
    }

    [Theory]
    [MemberData(nameof(AnyAlternativeOfferBoardSame_ReturnsTrueIfAltBoardsContainOtherBoard_Data))]
    public void AnyAlternativeOfferBoardSameAync_ReturnsTrueIfAltBoardsContainOtherBoard(string otherBoard,
        AvCacheResultOffersOfferBoard[] boards,
        bool expected)
    {
        var result = _sut.AnyAlternateBoardsContainBoardCode(boards, otherBoard);

        result.Should().Be(expected);
    }

    [Theory]
    [MemberData(nameof(DistinctAltBoards_Data))]
    public void DistinctAltBoardsAsync(AltBoardType[] alternativeBoards, AltBoardType[] expected)
    {
        var result = _sut.DistinctAlternateBoards(alternativeBoards);

        result.Should().BeEquivalentTo(expected);
    }

    [Theory]
    [MemberData(nameof(GetBoardGroup_Data))]
    public void GetBoardGroup(string boardCode, string expected)
    {
        var result = _sut.GetBoardGroupOrCode(boardCode);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void GetSelectedBoard_ReturnsAvCacheResultOffersOfferBoard()
    {
        var response = new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "HB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build();

        var result = _sut.GetSelectedBoard(response);

        result.Code.Should().Be(response.GetSelectedBoardCode());
        result.Price.Should().Be(response.Price);
        result.UnitCode.Should().Be(response.GetUnit().Code);
        result.AccommodationId.Should().Be(response.GetAccommodationId());
        result.IsExternal.Should().Be(response.IsExternal());
        result.PackageId.Should().Be(response.GetPackageId());
        result.System.Should().Be(response.GetSystem());
    }

    [Fact]
    public void SelectBoard_NoMatchingAltBoard_ReturnsAsync()
    {
        var boardCode = "BB";
        var response = new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "HB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build();

        var boardTypes = new Dictionary<string, ReferenceData.BoardType>
            {
                { "BB", new() { Code = "BB", } },
                { "BB-", new() { Code = "BB-", BoardGroup = new() { Code = "BB" } } },
            };

        var result = _sut.SelectBoard(response, boardCode);

        result.Should().Be(response);
    }

    [Fact]
    public void SelectBoard_MatchingAltBoard_Selects()
    {
        var boardCode = "HB";
        var response = new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1500.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "AI", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build();

        var guestCount = response.Price / response.PricePP;

        var boardTypes = new Dictionary<string, ReferenceData.BoardType>
            {
                { "BB", new() { Code = "BB", } },
                { "BB-", new() { Code = "BB-", BoardGroup = new() { Code = "BB" } } },
                { "HB", new() { Code = "HB", } },
                { "AI", new() { Code = "AI", } },
                { "HB-", new() { Code = "HB-", BoardGroup = new() { Code = "HB" } } },
            };

        var result = _sut.SelectBoard(response, boardCode);

        result.Price.Should().Be(1500);
        result.PricePP.Should().Be(750);
        result.AltBoard.Length.Should().Be(3);
        result.AltBoard.Count(ab => ab.Code == "BB").Should().Be(2);
        result.AltBoard.Count(ab => ab.Code == "AI").Should().Be(1);
        result.GetSelectedBoardCode().Should().Be("HB");
    }

    [Fact]
    public void SelectBoard_MatchingAltBoard2_Selects()
    {
        var boardCode = "AI";
        var response = new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1500.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "AI", Price = 2000.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build();

        var guestCount = response.Price / response.PricePP;

        _sut.SelectBoard(response, boardCode);

        response.Price.Should().Be(2000);
        response.PricePP.Should().Be(1000);
        response.AltBoard.Length.Should().Be(3);
        response.AltBoard.Count(ab => ab.Code == "BB").Should().Be(1);
        response.AltBoard.Where(ab => ab.Code.Contains("HB", StringComparison.Ordinal)).Count().Should().Be(2);
        response.GetSelectedBoardCode().Should().Be("AI");
    }

    [Theory]
    [MemberData(nameof(SelectBoard_Data))]
    public void SelectBoard_OfferPricePP(string board,
        AvCacheResultOffersOffer offer,
        AvCacheResultOffersOffer expected)
    {
        _sut.SelectBoard(offer, board);

        offer.Should().BeEquivalentTo(expected);
    }

    public static TheoryData<string, AvCacheResultOffersOffer, AvCacheResultOffersOffer> SelectBoard_Data() => new()
    {
        {
            "AI",
            new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900)
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1500.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "AI", Price = 2000.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
            new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 2000, pricepp: 1000)
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1500.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1800.00m, UnitCode = "TW02", AccommodationId = "ESDO0029", PackageId = "packageId"}])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "AI", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
        },
        {
            "HB",
            new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1500.00m, UnitCode = "TW02" },
                            new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
            new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1500, pricepp: 750, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([
                            new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1800.00M, UnitCode = "TW02", AccommodationId = "ESDO0029", PackageId  = "packageId" },
                            new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1800.00M, UnitCode = "TW02", AccommodationId = "ESDO0029", PackageId  = "packageId"  }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1400, roomPricePP: 700, roomBoard: "HB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
        }
    };
    public static TheoryData<string, string> GetBoardGroup_Data() => new()
    {
        {
            "AI",
            "AI"
        },
        {
            "BB-",
            "BB"
        },
        {
            "HB+-",
            "HB+"
        },

    };

    public static TheoryData<AltBoardType[], AltBoardType[]> DistinctAltBoards_Data() => new()
    {
        {
            [
                new AltBoardType { Price = 100, Code = "BB"},
                new AltBoardType { Price = 100, Code = "HB"},
                new AltBoardType { Price = 100, Code = "FB"}
            ],
            [
                new AltBoardType { Price = 100, Code = "BB"},
                new AltBoardType { Price = 100, Code = "HB"},
                new AltBoardType { Price = 100, Code = "FB"}
            ]
        },
        {
            [
                new AltBoardType { Price = 100, Code = "BB"},
                new AltBoardType { Price = 90, Code = "BB-"},
                new AltBoardType { Price = 100, Code = "HB"},
                new AltBoardType { Price = 110, Code = "HB-"},
                new AltBoardType { Price = 100, Code = "FB"}
            ],
            [
                new AltBoardType { Price = 90, Code = "BB-"},
                new AltBoardType { Price = 100, Code = "HB"},
                new AltBoardType { Price = 100, Code = "FB"}
            ]
        },
    };

    public static TheoryData<string, AvCacheResultOffersOfferBoard[], bool> AnyAlternativeOfferBoardSame_ReturnsTrueIfAltBoardsContainOtherBoard_Data() =>
        new()
        {
            {
                "HB",
                [
                    new AvCacheResultOffersOfferBoard{ Code = "BB"}
                ],
                false
            },
            {
                "BB",
                [
                    new AvCacheResultOffersOfferBoard() { Code = "BB" }
                ],
                true
            },
        };

    public static TheoryData<string, AvCacheResultOffersOffer[], AvCacheResultOffersOfferBoard[]> GetAllAlternativeBoards_ReturnsAllAlternativeBoards_Data() =>
        new()
        {
            {
                "BB",
                [
                    new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
                ],
                []
            },
            {
                "BB",
                [
                    new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1500.00m }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
                ],
                []
            },
            {
                "BB",
                [
                    new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "HB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
                ],
                [
                    new AvCacheResultOffersOfferBoard{ Code = "HB", AccommodationId = "ESDO0029", PackageId = "packageId", Price = 1600.00m, UnitCode = "TW02" },
                    new AvCacheResultOffersOfferBoard{ Code = "HB", AccommodationId = "ESDO0029", PackageId = "packageId", Price = 1800.00m, UnitCode = "TW02"  }
                ]
            },
            {
                "BB",
                [
                    new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "HB-", Price = 1600.00m, UnitCode = "TW02" }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029", packageId: "packageId")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "HB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build()
                ],
                [
                    new AvCacheResultOffersOfferBoard{ Code = "HB-", AccommodationId = "ESDO0029", PackageId = "packageId", Price = 1600.00m, UnitCode = "TW02" },
                    new AvCacheResultOffersOfferBoard{ Code = "HB", AccommodationId = "ESDO0029", PackageId = "packageId", Price = 1800.00m, UnitCode = "TW02"  }
                ]
            },
            {
                "",
                [
                        new()
                        {
                            Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW01", roomBoard: "HH").Build(),
                            Price = 100,
                            PricePP = 100,
                            AltBoard =
                            [
                                new AvCacheResultOffersOfferBoard { Code = "HH", Price = 120, },
                            ],
                        },
                        new()
                        {
                            Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW02", roomBoard: "HH").Build(),
                            Price = 100,
                            PricePP = 100,
                            AltBoard =
                            [
                                new AvCacheResultOffersOfferBoard { Code = "HH", Price = 140, },
                                new AvCacheResultOffersOfferBoard { Code = "AI", Price = 240, },
                            ],
                        },
                        new()
                        {
                            Accom = new AtComBuilders.AtcomAccommadationResponseBuilder().WithAccommadation().WithUnit(roomCode: "TW03", roomBoard: "HH").Build(),
                            Price = 100,
                            PricePP = 100,
                            AltBoard =
                            [
                                new AvCacheResultOffersOfferBoard { Code = "HH", Price = 160, },
                                new AvCacheResultOffersOfferBoard { Code = "AI", Price = 260, },
                            ]
                        }
                ],
                [
                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 100.00m, UnitCode = "TW01" },
                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 100.00m, UnitCode = "TW02" },
                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 100.00m, UnitCode = "TW03" },

                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 120.00m, UnitCode = "TW01" },
                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 140.00m, UnitCode = "TW02" },
                    new AvCacheResultOffersOfferBoard{ Code = "HH", Price = 160.00m, UnitCode = "TW03" },
                    new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 260.00m, UnitCode = "TW03" },
                    new AvCacheResultOffersOfferBoard{ Code = "AI", Price = 240.00m, UnitCode = "TW02" },
                ]
            }
        };


    public static TheoryData<string, AltBoardType[], AltBoardType> Same_ReturnsMatch_Data() =>
        new()
        {

            {
                "BB",
                new List<AltBoardType>{ new() { Code = "BB"}, }.ToArray(),
                new AltBoardType() { Code = "BB"}
            },
            {
                "BB-",
                new List<AltBoardType>{ new() { Code = "BB"}, }.ToArray(),
                new AltBoardType() { Code = "BB"}
            }
        };

    public static TheoryData<string, AvCacheResultOffersOffer, bool> AnyAlternativeOffer_ReturnsTrueOrFalse_Data() =>
        new()
        {

            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                false
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "SC", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                true
            }
        };

    public static TheoryData<string, AvCacheResultOffersOffer, bool> HasRequestedBoardType_ReturnsTrueOrFalse_Data() =>
        new()
        {
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "SC", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                false
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                true
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1500.00m }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "FB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                true
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "AI", Price = 1500.00m }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "FB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                false
            }
        };

    public static TheoryData<string, AvCacheResultOffersOffer, decimal?> GetBoardPrice_ReturnsPriceOrNull_Data() =>
        new()
        {
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                1800.00m
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "BB", Price = 1500.00m }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "FB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                1500.00m
            },
            {
                "BB",
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                        .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                        .WithAltBoard([new AvCacheResultOffersOfferBoard() { Code = "AI", Price = 1500.00m }])
                        .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                            .WithAccommadation(accomId: "ESDO0029")
                            .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "FB", adult: 1, children: 2, infant: 0)
                            .Build())
                        .Build(),
                null
            }
        };

    public static TheoryData<string, AvCacheResultOffersOfferBoard[], AvCacheResultOffersOfferBoard?> FirstOrDefault_ReturnsAvCacheResultOffersOfferBoardOrNull_Data() =>
        new()
        {
            {
                "BB",
                new AvCacheResultOffersOfferBoard[]
                {
                    new AvCacheResultOffersOfferBoard() { Code = "BB-" },
                },
                new AvCacheResultOffersOfferBoard() { Code = "BB-" }
            },
            {
                "BB",
                new AvCacheResultOffersOfferBoard[]
                {
                    new AvCacheResultOffersOfferBoard() { Code = "JJ" },
                },
                null
            },
            {
                "BB-",
                new AvCacheResultOffersOfferBoard[]
                {
                    new AvCacheResultOffersOfferBoard() { Code = "BB" },
                },
                new AvCacheResultOffersOfferBoard() { Code = "BB" }
            },
            {
                "BB",
                new AvCacheResultOffersOfferBoard[]
                {
                    new AvCacheResultOffersOfferBoard() { Code = "BB" },
                },
                new AvCacheResultOffersOfferBoard() { Code = "BB" }
            }
        };
}
