using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

internal class MapperTestsHelper
{
    public static IFixture PrepareMapperFixture()
    {
        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Register<IOffersMapper>(() => fixture.Create<OffersMapper>());

        var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
        refDataMock.Setup(x => x.GetFlightFilters()).ReturnsAsync(new List<FlightFilters>());
        refDataMock.Setup(x => x.GetDiscountSettings()).ReturnsAsync(new DiscountSettings { DiscountThreshold = 1 });
        refDataMock.Setup(x => x.GetOfferFilterOptions()).ReturnsAsync(new OfferFilterOptions());

        var boardService = fixture.Freeze<Mock<IBoardService>>();
        boardService.Setup(bs => bs.SelectBoard(It.IsAny<AvCacheResultOffersOffer>(), "BB"));

        var routesMock = fixture.Freeze<Mock<IRouteAvailabilityService>>();
        routesMock.Setup(x => x.GetAvailabilityDates(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<string>()))
            .ReturnsAsync(new DatesAvailability { });

        var cacheSettings = fixture.Freeze<Mock<IOptions<CacheSettings>>>();
        cacheSettings.Setup(cs => cs.Value).Returns(new CacheSettings { Buckets = new() { WeatherData = nameof(CacheSettings.Buckets.WeatherData), PromotionCollections = nameof(CacheSettings.Buckets.PromotionCollections) } });

        var dataString = File.ReadAllText("./Mappers/Search/Filters/weatherData.json");
        IEnumerable<RegionWeather> data = JsonConvert.DeserializeObject<IEnumerable<RegionWeather>>(dataString);
        var promotion = new PromotionCollections()
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion> { new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1") })
        };

        var cacheService = fixture.Freeze<Mock<ICacheService>>();
        cacheService.Setup(cs => cs.GetOrAddAsync(nameof(CacheSettings.Buckets.WeatherData), new List<string> { nameof(CacheSettings.Buckets.WeatherData) }, It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(), false)).ReturnsAsync(data);

        var promotionCollectionsService = fixture.Freeze<Mock<IPromotionCollectionsService>>();
        promotionCollectionsService.Setup(pcs => pcs.GetPromotionConfiguration())
            .ReturnsAsync(promotion);

        var languageService = fixture.Freeze<Mock<ILanguageService>>();
        languageService.Setup(ls => ls.GetCurrentLanguage()).Returns("en");

        return fixture;
    }

    public static AvCacheResultOffersOfferExtended CreateOffer(decimal price, string unitBoard, Board[] alternativeBoards = null, decimal unitDiscount = 0)
    {
        var allBoards = new List<Board> { new Board { Code = unitBoard, Price = price } };

        if (alternativeBoards is not null)
        {
            allBoards.AddRange(alternativeBoards);
        }

        return new AvCacheResultOffersOfferExtended
            (
                new AvCacheResultOffersOffer()
                {
                    AllBoards = allBoards,
                    AltBoard = alternativeBoards != null ? alternativeBoards.Select(x =>
                        new AvCacheResultOffersOfferBoard()
                        {
                            Code = x.Code,
                            Price = x.Price,
                        }).ToArray() : null,
                    Price = price,
                },
                new[]
                {
                    new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                    {
                        Prom = "ASDE",
                        Cty2 = "DEMU",
                        Unit = unitBoard != null ?  new[]
                        {
                            new AvCacheResultOffersOfferAccomUnit()
                            {
                                Board = unitBoard,
                                Disc = unitDiscount
                            }
                        } : null
                    })
                }
            );
    }

    public static AvCacheResultOffersOfferExtended CreateOffer(string unitBoard, string[] alternativeBoards = null)
    {
        var allBoards = new List<string>() { unitBoard };

        if (alternativeBoards is not null)
        {
            allBoards.AddRange(alternativeBoards);
        }

        return new AvCacheResultOffersOfferExtended
            (
                new AvCacheResultOffersOffer()
                {
                    AllBoards = allBoards.Select(x => new Board { Code = x }).ToList(),
                    AltBoard = alternativeBoards != null ? alternativeBoards.Select(x =>
                        new AvCacheResultOffersOfferBoard()
                        {
                            Code = x
                        }).ToArray() : null
                },
                new[]
                {
                    new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                    {
                        Prom = "ASDE",
                        Cty2 = "DEMU",
                        Unit = unitBoard != null ?  new[]
                        {
                            new AvCacheResultOffersOfferAccomUnit()
                            {
                                Board = unitBoard
                            }
                        } : null
                    })
                }
        );
    }
}