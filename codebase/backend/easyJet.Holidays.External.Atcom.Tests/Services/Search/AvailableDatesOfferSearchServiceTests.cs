using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Search;

public class AvailableDatesOfferSearchServiceTests
{
    private Mock<SearchRequestsMapper> _searchRequestsMapper = new Mock<SearchRequestsMapper>();
    private Mock<IReferenceDataService> _referenceDataService = new Mock<IReferenceDataService>();
    private Mock<IApiService> _searchOffersApiService = new Mock<IApiService>();
    private Mock<IBookingRepository> _bookingRepository = new Mock<IBookingRepository>();
    private Mock<IBoardService> _boardService = new Mock<IBoardService>();

    private Mock<SearchOffersService> _searchOffersService;

    private IFixture _fixture = FixtureUtils.AutoMoqFixture();

    private AtcomSettings _atcomSettings = new AtcomSettings
    {
        Booking = new AtcomApiSettings
        {
            Host = "http://localhost",
            BaseUrl = "/b"
        },
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
            SearchDates = "AnyTemplate"
        }
    };

    private IAvailableDatesOfferSearchService _sut;

    public AvailableDatesOfferSearchServiceTests()
    {
        _fixture.Inject(Options.Create(_atcomSettings));
        _fixture.Inject(Options.Create(new SearchSettings()));

        _searchOffersService = new Mock<SearchOffersService>(
            _boardService.Object,
            _searchOffersApiService.Object,
            _fixture.Create<EndpointsProvider>(),
            _fixture.Create<SearchRequestsMapper>(),
            _fixture.Create<ICacheService>(),
            _fixture.Create<IOptions<AtcomSettings>>(),
            _fixture.Create<IOptions<CacheSettings>>(),
            _fixture.Create<ISettingsService>(),
            _fixture.Create<IHttpContextAccessor>(),
            _fixture.Create<IMarketService>(),
            _fixture.Create<ILogger<SearchOffersService>>(),
            _referenceDataService.Object
        );

        _searchRequestsMapper = new Mock<SearchRequestsMapper>(
            _fixture.Create<IOptions<SearchSettings>>(),
            _fixture.Create<IOptions<SmartSeerSettings>>(),
            _fixture.Create<IOptions<AtcomSettings>>());

        var hotelThemeService = new HotelThemeService(_referenceDataService.Object, Options.Create(new CmsSettings()));
        var pricesService = new PricesService(Options.Create(new ApiSettings()));
        var offersMapper = new OffersMapper(_referenceDataService.Object, hotelThemeService, Options.Create(_atcomSettings), pricesService);

        _sut = new AvailableDatesOfferSearchService(
            _searchRequestsMapper.Object,
            Options.Create<AtcomSettings>(_atcomSettings),
            _searchOffersService.Object,
            _fixture.Create<IMarketService>(),
            _referenceDataService.Object,
            _bookingRepository.Object,
            offersMapper);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public async Task AvailableDates_AtcomReturnOffers(AvCacheResultOffersOffer[] offers, AmendDateInfoResponse expectedResult)
    {
        //Arrange
        var TODAYS_DATE = DateTime.UtcNow;
        var NEXT_YEAR = DateTime.UtcNow.AddDays(365);
        var DATE_IN_28_DAYS = DateTime.UtcNow.AddDays(28);

        var searchResponse = new SearchAvailablePackagesResponse
        {
            Payload = new XmlApiPayload<AvCache>
            {
                Body = new AvCache
                {
                    Result = new AvCacheResult
                    {
                        Offers = new AvCacheResultOffers
                        {
                            Offer = offers
                        }
                    }
                }
            }
        };

        var amendDateInfoRequest = new AmendDateInfoRequest
        {
            StartDate = TODAYS_DATE,
            EndDate = NEXT_YEAR,
            Duration = 5,
            AccommodationId = "AccomId",
            Departure = "LGW",
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults = 1,
                    RoomCode = "RoomCode"
                }
            }
        };

        _searchOffersApiService
            .Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()))
            .ReturnsAsync(searchResponse);

        _referenceDataService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(new AmendBookingSetting
        {
            ChangeDatesThresholdHours = 28
        });

        //Act
        var result = await _sut.AvailableDates(amendDateInfoRequest);

        //Assert
        using (new AssertionScope())
        {
            result.Should().BeEquivalentTo(expectedResult);
        }
    }

    public static IEnumerable<object[]> GetData()
    {
        var TODAYS_DATE = DateTime.UtcNow;
        var NEXT_YEAR = DateTime.UtcNow.AddDays(365);
        var DATE_IN_28_DAYS = DateTime.UtcNow.AddDays(28);

        yield return new object[]
        {
            new AvCacheResultOffersOffer[]
            {
                 new AvCacheResultOffersOffer {Date = TODAYS_DATE, Avail = YesNo.N},
                 new AvCacheResultOffersOffer {Date = DATE_IN_28_DAYS, Avail = YesNo.N}
            },
            new AmendDateInfoResponse
            {
                AmendDates = new List<AmendDate>
                {
                    new AmendDate
                    {
                        Date = DateFormatUtils.DateOnly(TODAYS_DATE)
                    },
                    new AmendDate
                    {
                        Date =  DateFormatUtils.DateOnly(DATE_IN_28_DAYS)
                    }
                }
            }
        };
        yield return new object[]
        {
            new AvCacheResultOffersOffer[]
            {
                 new AvCacheResultOffersOffer {Date = TODAYS_DATE, Avail = YesNo.N},
                 new AvCacheResultOffersOffer {Date = DATE_IN_28_DAYS, Avail = YesNo.Y}
            },
            new AmendDateInfoResponse
            {
                AmendDates = new List<AmendDate>
                {
                    new AmendDate
                    {
                        Date = DateFormatUtils.DateOnly(TODAYS_DATE)
                    },
                    new AmendDate
                    {
                        Date =  DateFormatUtils.DateOnly(DATE_IN_28_DAYS),
                        IsAvailable = true
                    }
                },
                AvailableHoliday = true
            }
        };
    }
}