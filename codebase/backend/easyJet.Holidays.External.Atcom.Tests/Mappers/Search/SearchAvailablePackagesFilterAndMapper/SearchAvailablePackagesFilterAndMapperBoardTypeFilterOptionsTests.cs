using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Utils;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperBoardTypeFilterOptionsTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;
        private readonly Mock<IBoardService> _boardService;

        public SearchAvailablePackagesFilterAndMapperBoardTypeFilterOptionsTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            _boardService = fixture.Freeze<Mock<IBoardService>>();
            MockGetBoardTypes(refDataMock);
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        private void MockGetBoardTypes(Mock<IReferenceDataService> refDataMock)
        {
            refDataMock.Setup(x => x.GetBoardTypes()).ReturnsAsync(new Dictionary<string, Holidays.Api.Domain.Data.ReferenceData.BoardType>()
            {
                {"AI", new Holidays.Api.Domain.Data.ReferenceData.BoardType()},
                {"AI+", new Holidays.Api.Domain.Data.ReferenceData.BoardType()
                    {
                        Code = "AI+",
                        BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup()
                        {
                            Code = "AI",
                            Name = "All Inclusive"
                        }
                    }
                },
                {"AI-", new Holidays.Api.Domain.Data.ReferenceData.BoardType()
                    {
                        Code = "AI-",
                        BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup()
                        {
                            Code = "AI",
                            Name = "All Inclusive"
                        }
                    }
                },
                {"BB", new Holidays.Api.Domain.Data.ReferenceData.BoardType()},
                {"FB", new Holidays.Api.Domain.Data.ReferenceData.BoardType()},
                {"HB", new Holidays.Api.Domain.Data.ReferenceData.BoardType()},
                {"HB+", new Holidays.Api.Domain.Data.ReferenceData.BoardType()
                    {
                        Code = "HB+",
                        BoardGroup = new Holidays.Api.Domain.Data.Hotels.BoardGroup()
                        {
                            Code = "HB",
                            Name = "Half Board"
                        }
                    }
                },
                {"SC", new Holidays.Api.Domain.Data.ReferenceData.BoardType()},
            });
        }

        [Theory]
        [MemberData(nameof(MapOptions_NullResponse))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapOptions_EmptyResponse))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(FilterByAltBoard))]
        public async Task Map_OrderByPriceAndFilterByAltBoard(KeyValuePair<AvCacheResultOffersOfferExtended, AvCacheResultOffersOfferExtended>[] offers, PackagesSearchRequest request)
        {
            offers.ToList().ForEach(o =>
            {
                if (o.Value is not null)
                {
                    _boardService
                        .Setup(bs => bs.SelectBoard(o.Key, request.BoardType))
                        .Returns(o.Value)
                        .Verifiable();
                }
            });

            // Act
            var actual = await _sut.MapWithFilters(offers.Select(o => o.Key).ToList(), request, false);

            // Assert
            _boardService.Verify(bs => bs.SelectBoard(It.IsAny<AvCacheResultOffersOfferExtended>(), request.BoardType), Times.Once);
        }

        [Theory]
        [MemberData(nameof(Map_Cheapest_Board_And_Filter_By_Discount))]
        public async Task MapWithFilters_SetCheapestBoardFromSelectedAndFilterByDiscount_ShouldFilter(
            KeyValuePair<AvCacheResultOffersOfferExtended, AvCacheResultOffersOfferExtended>[] offers, PackagesSearchRequest request)
        {
            // Arrange
            var boardTypes = BoardUtils.ParseBoardTypes(request);
            offers.ToList().ForEach(o =>
            {
                if (o.Value is not null)
                {
                    _boardService
                        .Setup(bs => bs.SelectBoard(o.Key, request.BoardType))
                        .Returns(o.Value)
                        .Verifiable();
                }
            });

            // Act
            var actual = await _sut.MapWithFilters(offers.Select(o => o.Key).ToList(), request, false);

            // Assert
            _boardService.Verify(bs => bs.SelectBoard(It.IsAny<AvCacheResultOffersOfferExtended>(), "AI"), Times.Exactly(2));
        }

        private static PackagesSearchRequest CreateSearchRequest(string boardType = null, int? adults = null)
        {
            return new PackagesSearchRequest()
            {
                BoardType = boardType,
                Room = adults != null ? new List<RoomAllocation>() {
                    new RoomAllocation{
                        Adults = adults.Value
                    }
                } : null
            };
        }

        public static IEnumerable<object[]> MapOptions_NullResponse()
        {
            return new List<object[]>
            {
                new object[]
                {
                    null,
                    CreateSearchRequest(boardType: "BB")
                }
            };
        }

        public static IEnumerable<object[]> MapOptions_EmptyResponse()
        {
            return new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>(),
                    CreateSearchRequest(boardType: "BB")
                }
            };
        }

        public static TheoryData<KeyValuePair<AvCacheResultOffersOfferExtended, AvCacheResultOffersOfferExtended>[], PackagesSearchRequest> FilterByAltBoard => new()
        {
            {
                [
                    KeyValuePair.Create(MapperTestsHelper.CreateOffer(100, "BB"), (AvCacheResultOffersOfferExtended)null),
                    KeyValuePair.Create(MapperTestsHelper.CreateOffer(110, "SC", new [] {new Board{ Code="BB", Price = 50 } }), MapperTestsHelper.CreateOffer(50, "BB")),
                    KeyValuePair.Create(MapperTestsHelper.CreateOffer(120, "BB", new [] {new Board{ Code="SC", Price = 120 } }), (AvCacheResultOffersOfferExtended)null),
                ],
                new PackagesSearchRequest()
                {
                    BoardType = "BB",
                    Room = new List<RoomAllocation>() {
                        new RoomAllocation{
                            Adults = 1,
                        }
                    },
                    OrderBy = OrderByField.Price,
                    Duration = [4]
                }
            }
        };

        public static TheoryData<KeyValuePair<AvCacheResultOffersOfferExtended, AvCacheResultOffersOfferExtended>[], PackagesSearchRequest> Map_Cheapest_Board_And_Filter_By_Discount => new()
            {
                {
                    [
                        // should not pass in result set due to being not in filter by discount range
                        KeyValuePair.Create(MapperTestsHelper.CreateOffer(100, "HB", new [] {new Board { Code = "AI", Price = 150} }, 9), MapperTestsHelper.CreateOffer(150, "AI")), 
                        // should pass in result set due to being in filter by discount percent range
                        KeyValuePair.Create(MapperTestsHelper.CreateOffer(100, "HB", new [] {new Board { Code = "AI", Price = 110} }, 10), MapperTestsHelper.CreateOffer(110, "AI")),
                        // should pass in result set 
                        KeyValuePair.Create(MapperTestsHelper.CreateOffer(100, "AI", new [] {new Board { Code = "HB+", Price = 90} }, 9), (AvCacheResultOffersOfferExtended)null), 
                        // should not pass in result set due to being not in filter by discount percent range
                        KeyValuePair.Create(MapperTestsHelper.CreateOffer(100, "AI", unitDiscount: 7.8m), (AvCacheResultOffersOfferExtended)null)
                    ],
                    new PackagesSearchRequest() {
                        BoardType = "AI,AS,AI+",
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation{
                                Adults = 2,
                            }
                        },
                        OrderBy = OrderByField.DiscPercent,
                        MinDiscP = 8,
                        MaxDiscP = 13,
                        Duration = [4]
                    }
                }
            };

    }
}