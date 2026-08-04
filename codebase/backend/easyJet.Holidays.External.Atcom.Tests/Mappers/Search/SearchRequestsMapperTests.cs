using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchRequestsMapperTests
    {
        private IOptions<SmartSeerSettings> _smartSeerSettings = Options.Create(new SmartSeerSettings());
        private IOptions<AtcomSettings> _atcomSettings = Options.Create(new AtcomSettings
        {
            Transfers = new TransfersSettings
            {
                Types = new TransferTypesSettings
                {
                    Shared = new List<string> { "S" }
                }
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                SearchAccomOffers = "typeFour"
            }
        });

        private IOptions<SearchSettings> _searchSettings = Options.Create(new SearchSettings
        {
            DefaultFlexibleDays = 3
        });

        [Theory]
        [MemberData(nameof(MapBaseSearchRequestTestData))]
        public void MapBaseSearchRequest_MapAllFieldsRespectingFlexible(string because, BaseSearchRequest request, SearchAvailablePackagesRequest expected)
        {
            // Arrange
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            // Act
            var actual = sut.MapBaseSearchRequest(request);

            // Assert
            actual.Should().BeEquivalentTo(expected, because);
        }

        [Fact]
        public void MapBaseSearchRequest_MultipleDeparturs_Join()
        {
            // Arrange
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            var request = new BaseSearchRequest
            {
                StartDate = "2019-01-05",
                Duration = new List<int> { 7, 8, 9 },
                Departure = "LGW",
                Room = new List<RoomAllocation>(){
                        new RoomAllocation {
                            Adults=1,
                            Children=1,
                            Infants=1
                        },
                        new RoomAllocation {
                            Adults=1
                        },
                    },
                ChildAges = "7",
                BoardType = "BB",
            };
            // Act
            var actual = sut.MapBaseSearchRequest(request);

            // Assert
            actual.Duration.Should().Be("7,8,9");
        }

        [Fact]
        public void MapAmendDateSummaryInfo_ValidDataIncludeTransfer_ReturnValidSearchAvailablePackagesRequest()
        {
            // Arrange
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            var request = new AmendDatesSummaryRequest
            {
                AccomId = "1",
                BoardType = "BB",
                BookingRef = "validRef",
                ChildAges = String.Empty,
                Duration = "1",

                Room = Array.Empty<RoomAllocation>(),
                SelectedDate = new DateTime(2023, 1, 1, 1, 1, 1),
                TransferCode = "1234SS"
            };

            // Act
            var actual = sut.MapAmendDateSummaryInfo(request, true);

            // Assert
            actual.Should().NotBeNull();
            actual.AccommodationId.Should().Be("1");
            actual.Duration.Should().Be("1");
            actual.BoardTypes.Should().Be("BB");
            actual.StartDate.Should().Be("2023-01-01");
            actual.EndDate.Should().Be("2023-01-01");
            actual.IncludedTransfer.Should().Be("S");
            actual.QueryParams.Should().Be("typeFour");
            actual.QueryStringTemplate.Should().Be("typeFour");
            actual.ChildAges.Should().BeEquivalentTo(new string[] { string.Empty });
        }

        [Fact]
        public void MapAmendDateSummaryInfo_ValidData_ReturnValidSearchAvailablePackagesRequest()
        {
            // Arrange
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            var request = new AmendDatesSummaryRequest
            {
                AccomId = "1",
                BoardType = "BB",
                BookingRef = "validRef",
                ChildAges = String.Empty,
                Duration = "1",

                Room = Array.Empty<RoomAllocation>(),
                SelectedDate = new DateTime(2023, 1, 1, 1, 1, 1),
                TransferCode = "1234SS"
            };

            // Act
            var actual = sut.MapAmendDateSummaryInfo(request, false);

            // Assert
            actual.Should().NotBeNull();
            actual.AccommodationId.Should().Be("1");
            actual.Duration.Should().Be("1");
            actual.BoardTypes.Should().Be("BB");
            actual.StartDate.Should().Be("2023-01-01");
            actual.EndDate.Should().Be("2023-01-01");
            actual.IncludedTransfer.Should().Be("Y");
            actual.QueryParams.Should().Be("typeFour");
            actual.QueryStringTemplate.Should().Be("typeFour");
            actual.ChildAges.Should().BeEquivalentTo(new string[] { string.Empty });
        }

        public static IEnumerable<object[]> MapBaseSearchRequestTestData()
        {
            yield return new object[] {
                "Non flexible request",
                new BaseSearchRequest {
                    StartDate="2019-01-05",
                    Duration=new List<int> { 7 },
                    Departure="LGW",
                    Room=new List<RoomAllocation>(){
                        new RoomAllocation {
                            Adults=1,
                            Children=1,
                            Infants=1
                        },
                        new RoomAllocation {
                            Adults=1
                        },
                    },
                    ChildAges="7",
                    BoardType="BB",
                    FlexibleDays = 0
                },

                new SearchAvailablePackagesRequest {
                    StartDate="2019-01-05",
                    EndDate="2019-01-05",
                    Duration="7",
                    Departure=new[] {"LGW" },
                    DepartureAirports= new[] {"LGW" },
                    Adults=2,
                    Children=1,
                    ChildAges=new[] {"7" },
                    Infants=1,
                    Rooms=2
                }
            };

            yield return new object[] {
                "Flexible request(FlexibleDays=3)",
                new BaseSearchRequest {
                    StartDate="2019-01-05",
                    Duration=new List<int> { 7 },
                    Departure="LGW",
                    Room=new List<RoomAllocation>(){
                        new RoomAllocation {
                            Adults=1,
                            Children=1,
                            Infants=1
                        },
                        new RoomAllocation {
                            Adults=1
                        },
                    },
                    ChildAges="7",
                    BoardType="BB",
                    FlexibleDays = 3,
                },
                new SearchAvailablePackagesRequest {
                    StartDate="2019-01-02",
                    EndDate="2019-01-08",
                    Duration="7",
                    Departure=new[] {"LGW" },
                    DepartureAirports= new[] {"LGW" },
                    Adults=2,
                    Children=1,
                    ChildAges=new[] {"7" },
                    Infants=1,
                    Rooms=2,
                }
            };
        }

        [Theory]
        [MemberData(nameof(MapSearchRequestAccomCodeTestData))]
        public void MapSearchRequest_AccomCode_AccomCodesNumberIsCorrect(string because, PackagesSearchRequest request, string geog, string accomCodes, int? accomCodesNumber)
        {
            // Arrange
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            // Act
            var actual = sut.MapSearchRequest(request, null);

            // Assert
            actual.AccomCodesNumber.Should().Be(accomCodesNumber, because);
            actual.AccomCodes.Should().Be(accomCodes, because);
            actual.Geography.Should().Be(geog, because);
        }

        public static IEnumerable<object[]> MapSearchRequestAccomCodeTestData()
        {
            yield return new object[] {
                "No accom codes",
                new PackagesSearchRequest {
                    StartDate = "2019-01-05",
                    AccomCodes = null,
                    Geography="ES",
                },
                "ES",
                null,
                null
            };
            yield return new object[] {
                "Single accom code",
                new PackagesSearchRequest {
                    StartDate = "2019-01-05",
                    AccomCodes = "123",
                    Geography="ES",
                },
                null,
                "123",
                1
            };
            yield return new object[] {
                "Multiple accom codes",
                new PackagesSearchRequest {
                    StartDate = "2019-01-05",
                    AccomCodes = "123,45,,",
                    Geography="ES",
                },
                null,
                "123,45,,",
                4
            };
        }

        [Fact]
        public void MapAlternativeFlightsMap_VaidData_MapAccommodationId()
        {
            // Arrange
            var request = new AlternativeFlightsSearchRequest()
            {
                AccommodationId = "123",
                StartDate = "2019-01-01"
            };

            var sut = new SearchRequestsMapper(Options.Create(new SearchSettings()), _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapAlternativeFlights(request, "{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should()
                .Contain("accom=123");
        }

        [Fact]
        public void MapAlternativeFlightsMap_VaidData_UsesTemplate()
        {
            // Arrange
            var request = new AlternativeFlightsSearchRequest()
            {
                AccommodationId = "123",
                StartDate = "2019-01-01",
            };
            var sut = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapAlternativeFlights(request, "query_template_{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should().StartWith("query_template_");
        }

        [Fact]
        public void MapSearchRequest_ValidInboundFlightNumber_MapInboundFlightNumber()
        {
            // Arrange
            var request = new PackagesSearchRequest()
            {
                StartDate = "2019-01-05",
                InboundFlightNumber = "EZY1234"
            };

            var sut = new SearchRequestsMapper(Options.Create(new SearchSettings()), _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapSearchRequest(request, "{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should()
                .Contain("tra_no_i=EZY1234");
        }

        [Fact]
        public void MapSearchRequest_ValidOutboundFlightNumber_MapOutboundFlightNumber()
        {
            // Arrange
            var request = new PackagesSearchRequest()
            {
                StartDate = "2019-01-05",
                OutboundFlightNumber = "EZY4321"
            };

            var sut = new SearchRequestsMapper(Options.Create(new SearchSettings()), _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapSearchRequest(request, "{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should()
                .Contain("tra_no_o=EZY4321");
        }

        [Fact]
        public void MapSearchRequest_ValidInboundAndOutboundFlightNumbers_MapInboundAndOutboundFlightNumbers()
        {
            // Arrange
            var request = new PackagesSearchRequest()
            {
                StartDate = "2019-01-05",
                InboundFlightNumber = "EZY1234",
                OutboundFlightNumber = "EZY4321"
            };

            var sut = new SearchRequestsMapper(Options.Create(new SearchSettings()), _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapSearchRequest(request, "{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should()
                .Contain("tra_no_i=EZY1234");

            actual.Should()
                .Contain("tra_no_o=EZY4321");
        }

        [Fact]
        public void MapSearchRequest_EmptyInboundAndOutboundFlightNumbers_MapInboundAndOutboundFlightNumbers()
        {
            // Arrange
            var request = new PackagesSearchRequest()
            {
                StartDate = "2019-01-05",
                InboundFlightNumber = "",
                OutboundFlightNumber = ""
            };

            var sut = new SearchRequestsMapper(Options.Create(new SearchSettings()), _smartSeerSettings, _atcomSettings);

            // Act
            var mappedRequest = sut.MapSearchRequest(request, "{0}");
            var actual = mappedRequest.QueryParams;

            // Assert
            actual.Should()
                .NotContain("tra_no_i");

            actual.Should()
                .NotContain("tra_no_o");
        }
    }
}
