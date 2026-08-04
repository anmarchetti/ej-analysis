using AutoFixture;
using AutoFixture.AutoMoq;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using SearchType = easyJet.Holidays.Api.Domain.Data.PackageOffers.SearchType;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;

public class MapPackageSearchRequestTests
{
    public class PackagesSearchRequestMapperTests
    {
        private readonly AtcomSettings _atcomSettings = new AtcomSettings
        {
            Booking = new AtcomApiSettings
            {
                Host = "http://localhost",
                BaseUrl = "/b"
            },
            AnywhereCode = "RND123",
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                SearchRoomVariants = "s_tp=6&{0}",
                BrandParam = "brnd={0}",
            },
            Transfers = new TransfersSettings()
        };

        private readonly Mock<SearchService> _searchServiceMock;
        
        public PackagesSearchRequestMapperTests()
        {
            IFixture fixture = new Fixture();
            fixture.Customize(new AutoMoqCustomization());
            fixture.Inject(Options.Create(_atcomSettings));

            _searchServiceMock = new Mock<SearchService>(
                fixture.Create<SearchOffersService>(),
                fixture.Create<SearchAvailablePackagesFilterAndMapper>(),
                fixture.Create<IOptions<SearchSettings>>(),
                fixture.Create<ILogger<SearchService>>()
            );
        }

        [Fact]
        public void MapNamedSearchRequestToPackagesSearchRequest_ShouldBeEqualWithExpectedObject_ReturnValidPackagesSearchRequestObject()
        {
            // Arrange
            var baseNamedSearchRequest = new RequestedPriceNamedSearch
            {
                Id = "12345",
                Adults = 2,
                Children = 1,
                Infants = 0,
                Duration = 7,
                ChildAges = new List<string> { "5", "8" },
                ThemeTypesCodes = new List<string> { "Beach", "Adventure" },
                Origin = new List<string> { "New York", "Los Angeles" },
                Destinations = new List<string> { "Miami" },
                AccomCodes = new List<string> { "ABC123" },
                Url = "http://test.com",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(10),
                InitialSearchDays = 5,
                BoardTypes = new List<string> { "All-Inclusive" },
                FacilityTypes = new List<string> { "Pool", "Spa" },
                StarRating = new List<string> { "4", "5" },
                TripAdvisorRating = 4.5,
                Currency = "GBP",
                MarketCode = "UK",
                MinPPPrice = 100,
                MaxPPPrice = 500,
                MinTotalPrice = 500,
                MaxTotalPrice = 2000,
                DiscountPercentsMin = 10,
                DiscountPercentsMax = 20,
                DiscountAmountMin = 50,
                DiscountAmountMax = 150,
                DiscountOnly = false,
                IsFlexibleDatesRange = true,
                FreeForKidsOnly = true,
                PromoCollections = new List<string> { "lux" }
            };

            var expectedPackagesSearchRequest = new PackagesSearchRequest
            {
                AutomaticAllocation = true,
                BoardType = "All-Inclusive",
                ChildAges = "5,8",
                Departure = "New York,Los Angeles",
                DiscountOnly = false,
                DistressedFlightsOnly = false,
                Duration = new List<int> { 7 },
                StartDate = DateTime.Now.ToString(DateFormatUtils.DateOnlyFormat),
                EndDate = DateTime.Now.AddDays(10).ToString(DateFormatUtils.DateOnlyFormat),
                Facilities = "Pool,Spa",
                FlexibleDays = 0,
                InitialPricePPFrom = 100,
                InitialPricePPTo = 500,
                InitialTotalPriceFrom = 500,
                InitialTotalPriceTo = 2000,
                IsPricePP = false,
                IsPromo = true,
                MarketCode = "UK",
                MaxDisc = 150,
                MaxDiscP = 20,
                MinDisc = 50,
                MinDiscP = 10,
                Offers = "ffk",
                OrderBy = OrderByField.SmartSeer,
                OrderDirection = OrderByDirection.Asc,
                Page = 0,
                PriceFrom = 0,
                PriceTo = 0,
                Room = new List<RoomAllocation>
                { new RoomAllocation
                    {
                        Adults = 2,
                        Children = 1,
                        Infants = 0
                    }
                },
                SearchType = SearchType.Promo,
                StarRating = "4,5",
                Take = 0,
                Themes = "Beach,Adventure",
                TripAdvisorRating = 5,
                Promc = "lux"
            };

            // Act
            var result = _searchServiceMock.Object.MapToPackagesSearchRequest(baseNamedSearchRequest);

            // Assert
            Assert.NotNull(result);
            result.Should().BeEquivalentTo(expectedPackagesSearchRequest);
        }
    }
}