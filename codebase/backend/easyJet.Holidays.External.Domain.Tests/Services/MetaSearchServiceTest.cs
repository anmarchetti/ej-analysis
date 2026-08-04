using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Services;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Services
{
    public class MetaSearchServiceTest
    {
        internal static object[] ValidData =>
        [
            new SearchOffersResponse()
            {
                Offers = new List<Offer>()
                {
                    new Offer()
                    {
                        Accom = new Accom()
                        {
                            Id = "AccomId",
                            PackageId = "PackageId",
                            Unit = new List<Unit>()
                            {
                                new Unit()
                                {
                                    BoardType = new BoardType() {Code = "BB"},
                                    Occupation = new Occupation()
                                    {
                                        Adults = 1,
                                        Children = 2,
                                        Infants = 0,
                                        ChildAges = new List<uint>() {1, 2}
                                    }
                                }
                            }
                        },
                        Transfers = new List<TransferItem>() {new TransferItem() {Code = "transfer"}},
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route() {Id = "1"}, new Route() {Id = "2"},
                            }
                        }
                    }
                }
            },
            new SearchOffersResponse()
            {
                Offers = new List<Offer>()
                {
                    new Offer()
                    {
                        Accom = new Accom()
                        {
                            Id = "AccomId",
                            Code = "AccomId",
                            PackageId = "PackageId",
                            Unit = new List<Unit>()
                            {
                                new Unit()
                                {
                                    BoardType = new BoardType() {Code = "BB"},
                                    Occupation = new Occupation()
                                    {
                                        Adults = 1,
                                        Children = 2,
                                        Infants = 0,
                                        ChildAges = new List<uint>() {1, 2},
                                    },
                                    Code = "ABC OFFER 24",
                                    Board = "BB"
                                }
                            }
                        },
                        Transfers = new List<TransferItem>() {new TransferItem() {Code = "transfer"}},
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route() {Id = "1"}, new Route() {Id = "2"},
                            }
                        },
                        Hotel = new OfferHotel()
                        {
                            Name = "Hotel Name Test",
                            Country = new HotelCountry() {Name = "Spain", Code = "ES"},
                            Location = new HotelLocation() {Name = "ESMA", Code = "Majorka"},
                            Resort = new HotelResort() {Name = "Test", Code = "Test"}
                        },
                        AlternativeAccommodations = new List<AlternativeAccommodation>()
                        {
                            new AlternativeAccommodation()
                            {
                                Code = "AccomId1",
                                PackageId= "PackageId1",
                            },
                            new AlternativeAccommodation()
                            {
                                Code = "AccomId2",
                                PackageId= "PackageId2",
                            }
                        },
                        AltBoards = new List<AltBoardType>()
                        {
                            new AltBoardType()
                            {
                                Code= "FB",
                                PackageId= "PackageId",
                                AccommodationId= "AccomId",
                                RoomAlterations = new Dictionary<string, string>()
                                {
                                    { "ABC OFFER 24", "DEF" }
                                }
                            },
                            new AltBoardType()
                            {
                                Code= "HB",
                                PackageId= "PackageId",
                                AccommodationId= "AccomId",
                                RoomAlterations = new Dictionary<string, string>()
                                {
                                    { "ABC OFFER 24", "GHI" }
                                }
                            }
                        }
                    }
                }
            },
            new PackagesSearchRequest()
            {
                Departure = "LGW,LTN",
                Utm_campaign = "Utm_campaign",
                Utm_content = "Utm_content",
                Utm_medium = "Utm_medium",
                Utm_source = "Utm_source",
                Utm_term = "Utm_term",
                StartDate = "2020-04-26",
                Duration = new List<int>() {2},
            }
        ];

        private static IOptions<SearchSettings> searchSettings = Options.Create(new SearchSettings
        {
            FrontendBasePath = "http://test",
            MetaSearchHeader = "Header"
        });

        private static IOptions<CmsSettings> cmsSettings = Options.Create(new CmsSettings() { PageSize = 200 });

        [Fact]
        public void UpdateHotelLink_NoHotel_NullDeepLink()
        {
            var context = new DefaultHttpContext();
            context.Request.Headers["header"] = "true";
            HttpContextAccessor httpContextAccessor = new HttpContextAccessor() { HttpContext = context, };

            // Arrange
            var service = new MetaSearchService(httpContextAccessor, null, searchSettings, cmsSettings);

            // Act
            var actual = service.UpdateHotelLink((SearchOffersResponse)ValidData[0], (PackagesSearchRequest)ValidData[2]);
            actual.Offers[0].DeepLink.Should().BeNull();
        }

        [Fact]
        public void UpdateHotelLink_HotelData_CorrectDeepLink()
        {
            var context = new DefaultHttpContext();
            context.Request.Headers["header"] = "true";
            HttpContextAccessor httpContextAccessor = new HttpContextAccessor() { HttpContext = context, };

            // Arrange
            var service = new MetaSearchService(httpContextAccessor, null, searchSettings, cmsSettings);

            // Act
            var actual = service.UpdateHotelLink((SearchOffersResponse)ValidData[1], (PackagesSearchRequest)ValidData[2]);
            actual.Offers[0].DeepLink.Should().Be("http://test/spain/esma/test/hotel-name-test?to=28-04-2020&from=26-04-2020&ibf=true&dst=Majorka&flex=false&org[0]=LGW&org[1]=LTN&rooms[0][adults]=1&rooms[0][children]=2&rooms[0][infants]=0&rooms[0][childrenAges][0]=1&rooms[0][childrenAges][1]=2&rooms[0][roomCode]=ABC%20OFFER%2024&outId=1&inId=2&accId=AccomId&packId=PackageId&offerCode=AccomId_PackageId_ABC%20OFFER%2024-BB&boardType=BB&offerRooms[0][adults]=1&offerRooms[0][children]=2&offerRooms[0][infants]=0&offerRooms[0][childrenAges][0]=1&offerRooms[0][childrenAges][1]=2&offerRooms[0][roomCode]=ABC%20OFFER%2024&transfer=transfer&dtransfer=transfer&altAccIds=AccomId1%2CAccomId2&altPackIds=PackageId1%2CPackageId2&isExt=0&utm_source=Utm_source&utm_medium=Utm_medium&utm_campaign=Utm_campaign&utm_term=Utm_term&utm_content=Utm_content");
        }

        [Fact]
        public void UpdateHotelLinkTest_NoHeader_NoCall()
        {
            var context = new DefaultHttpContext();
            context.Request.Headers["header1"] = "true";
            HttpContextAccessor httpContextAccessor = new HttpContextAccessor() { HttpContext = context, };

            // Arrange
            var service = new MetaSearchService(httpContextAccessor, null, searchSettings, cmsSettings);

            // Act
            var actual = service.UpdateHotelLink((SearchOffersResponse)ValidData[1], (PackagesSearchRequest)ValidData[2]);
            actual.Offers[0].DeepLink.Should().BeNull();
        }

        [Fact]
        public async Task ConvertOffers_HotelData_CorrectDeepLinks()
        {
            // Arrange
            var service = new MetaSearchService(null, null, searchSettings, cmsSettings);

            // Act
            var actual = await service.ConvertOffers((SearchOffersResponse)ValidData[1], (PackagesSearchRequest)ValidData[2]);

            //Assert
            var expectedBasePath = "http://test/spain/esma/test/hotel-name-test";
            using (new AssertionScope())
            {
                actual.Offers[0].DeepLink.Should().Be($"{expectedBasePath}?to=28-04-2020&from=26-04-2020&ibf=true&dst=Majorka&flex=false&org[0]=LGW&org[1]=LTN&rooms[0][adults]=1&rooms[0][children]=2&rooms[0][infants]=0&rooms[0][childrenAges][0]=1&rooms[0][childrenAges][1]=2&rooms[0][roomCode]=ABC%20OFFER%2024&outId=1&inId=2&accId=AccomId&packId=PackageId&offerCode=AccomId_PackageId_ABC%20OFFER%2024-BB&boardType=BB&offerRooms[0][adults]=1&offerRooms[0][children]=2&offerRooms[0][infants]=0&offerRooms[0][childrenAges][0]=1&offerRooms[0][childrenAges][1]=2&offerRooms[0][roomCode]=ABC%20OFFER%2024&transfer=transfer&dtransfer=transfer&altAccIds=AccomId1%2CAccomId2&altPackIds=PackageId1%2CPackageId2&isExt=0&utm_source=Utm_source&utm_medium=Utm_medium&utm_campaign=Utm_campaign&utm_term=Utm_term&utm_content=Utm_content");
                actual.Offers[0].AltBoards[0].DeepLink.Should().Be($"{expectedBasePath}?to=28-04-2020&from=26-04-2020&ibf=true&dst=Majorka&flex=false&org[0]=LGW&org[1]=LTN&rooms[0][adults]=1&rooms[0][children]=2&rooms[0][infants]=0&rooms[0][childrenAges][0]=1&rooms[0][childrenAges][1]=2&rooms[0][roomCode]=DEF&outId=1&inId=2&accId=AccomId&packId=PackageId&offerCode=AccomId_PackageId_DEF-FB&boardType=FB&offerRooms[0][adults]=1&offerRooms[0][children]=2&offerRooms[0][infants]=0&offerRooms[0][childrenAges][0]=1&offerRooms[0][childrenAges][1]=2&offerRooms[0][roomCode]=DEF&transfer=transfer&dtransfer=transfer&altAccIds=AccomId1%2CAccomId2&altPackIds=PackageId1%2CPackageId2&isExt=0&utm_source=Utm_source&utm_medium=Utm_medium&utm_campaign=Utm_campaign&utm_term=Utm_term&utm_content=Utm_content");
                actual.Offers[0].AltBoards[1].DeepLink.Should().Be($"{expectedBasePath}?to=28-04-2020&from=26-04-2020&ibf=true&dst=Majorka&flex=false&org[0]=LGW&org[1]=LTN&rooms[0][adults]=1&rooms[0][children]=2&rooms[0][infants]=0&rooms[0][childrenAges][0]=1&rooms[0][childrenAges][1]=2&rooms[0][roomCode]=GHI&outId=1&inId=2&accId=AccomId&packId=PackageId&offerCode=AccomId_PackageId_GHI-HB&boardType=HB&offerRooms[0][adults]=1&offerRooms[0][children]=2&offerRooms[0][infants]=0&offerRooms[0][childrenAges][0]=1&offerRooms[0][childrenAges][1]=2&offerRooms[0][roomCode]=GHI&transfer=transfer&dtransfer=transfer&altAccIds=AccomId1%2CAccomId2&altPackIds=PackageId1%2CPackageId2&isExt=0&utm_source=Utm_source&utm_medium=Utm_medium&utm_campaign=Utm_campaign&utm_term=Utm_term&utm_content=Utm_content");
            }
        }
    }
}