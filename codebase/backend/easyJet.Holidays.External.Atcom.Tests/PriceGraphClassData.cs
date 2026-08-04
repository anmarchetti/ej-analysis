using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using System.Collections;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.Atcom.Tests;

internal sealed class PriceGraphClassDataStartOfMonth : IEnumerable<object[]>
{
    private static string OutboundRouteId => "E2994e9d0707a84abadad895bf104c084";
    private static string InboundRouteId => "Eb30ee466e825190a7334a1586bbf3a89";

    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphRequestBuilder(startDate: "2024-09-01",
                initialDate: "2024-09-01",
                departure: "BHX",
                roomAllocations: new List<RoomAllocation> { new RoomAllocation { Adults = 1, Children = 2, RoomCode = "TW02" } },
                accommodationId: "ESDO0029",
                boardType:"BB"),
            new SearchAvailablePackagesRequest { },
            new MarketSettings(),
            new List<AvCacheResultOffersOffer>
            {
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build()
            },
            new Hotel(){ StarRating = "4" },
            new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 25, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 26, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 27, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 28, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 29, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 30, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 08, 31, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 01, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 03, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 04, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 05, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 06, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 07, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 08, 0, 0, 0, DateTimeKind.Utc) },
                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

internal sealed class PriceGraphMonthClassDataExtactMatch : IEnumerable<object[]>
{
    private static string OutboundRouteId => "E2994e9d0707a84abadad895bf104c084";
    private static string InboundRouteId => "Eb30ee466e825190a7334a1586bbf3a89";

    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphMonthRequestBuilder(
                startDate: "2024-09-01",
                endDate: "2024-10-31",
                departure: "BHX",
                roomAllocations: new List<RoomAllocation> { new RoomAllocation { Adults = 1, Children = 2, RoomCode = "TW02" } },
                accommodationId: "ESDO0029",
                boardType:"BB"),
            new SearchAvailablePackagesRequest { },
            new MarketSettings(),
            new List<AvCacheResultOffersOffer>
            {
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
            },
           new Hotel(){ StarRating = "4" },
           new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 01, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 02, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 03, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 04, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 05, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 06, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 07, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 08, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 09, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 10, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 11, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 12, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 13, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 14, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 15, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 16, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 17, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 18, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 20, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 21, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 22, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 27, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 28, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 29, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 30, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 01, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 02, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 03, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 04, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 05, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 06, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 07, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 08, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 09, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 10, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 11, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 13, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 14, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 15, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 16, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 17, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 18, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 19, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 20, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 21, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 22, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 23, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 24, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 26, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 28, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 29, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc) },

                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

}

[SuppressMessage("Microsoft.Performance", "CA1812:AvoidUninstantiatedInternalClasses", Justification = "generic/late bound/reflection used in unit tests")]
internal sealed class PriceGraphClassDataNoOffers : IEnumerable<object[]>
{

    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphRequestBuilder(
                startDate: "2024-10-31",
                initialDate: "2024-10-31",
                departure: "BHX",
                roomAllocations: new List<RoomAllocation> { new RoomAllocation { Adults = 1, Children = 2, RoomCode = "TW02" } },
                accommodationId: "ESDO0029",
                boardType:"BB"),
            new SearchAvailablePackagesRequest { },
            new MarketSettings(),
            new Hotel(),
           new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 24, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 25, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 26, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 28, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 29, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 01, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 02, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 03, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 04, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 05, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 06, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 11, 07, 0, 0, 0, DateTimeKind.Utc) },
                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

internal sealed class PriceGraphClassDataExtactMatch : IEnumerable<object[]>
{
    private static string OutboundRouteId => "E2994e9d0707a84abadad895bf104c084";
    private static string InboundRouteId => "Eb30ee466e825190a7334a1586bbf3a89";

    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphRequestBuilder(startDate: "2024-09-19",
                initialDate: "2024-09-19",
                departure: "BHX",
                roomAllocations: new List<RoomAllocation> { new RoomAllocation { Adults = 1, Children = 2, RoomCode = "TW02" } },
                accommodationId: "ESDO0029",
                boardType:"BB"),
            new SearchAvailablePackagesRequest { },
            new SearchAvailablePackagesResponse { },
            new MarketSettings(),
            new List<AvCacheResultOffersOffer>
            {
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
            },
            new Hotel() { StarRating = "4" },
           new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 12, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 13, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 14, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 15, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 16, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 17, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 18, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId = InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 20, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 21, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 22, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            }
                        }
                    }
                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

}

internal static class Reader
{
    public static AvCache GetResponse(string atComResponseFile)
    {
        XmlSerializer serializer = new XmlSerializer(typeof(AvCache));

        // Declare an object variable of the type to be deserialized.
        AvCache avCache;

        using (Stream reader = File.OpenRead(atComResponseFile))
        {
            // Call the Deserialize method to restore the object's state.
            avCache = (AvCache)serializer.Deserialize(reader);
        }

        return avCache;
    }
}

internal sealed class PriceGraphClassDataIncomplete : IEnumerable<object[]>
{
    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphRequestBuilder(startDate: "2024-11-03",
                initialDate: "2024-11-03",
                departure: "LGW",
                roomAllocations: new List<RoomAllocation> {
                    new RoomAllocation { Adults = 2, Children = 1, RoomCode = "DB01" },
                    new RoomAllocation { Adults = 1, Children = 0, RoomCode = "DB01" } },
                accommodationId: "MAAG0012",
                boardType:"AI"),
            new SearchAvailablePackagesRequest { },
            new MarketSettings(),
            new List<AvCacheResultOffersOffer>
            {
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 3417.00M, pricepp: 854.25M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 750, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8", inboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 3070.00M, pricepp: 767.50M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8", inboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2793.00M, pricepp: 698.25M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8", inboundRouteId: "E979d115a69c4f88638fa2f17b3b499e8").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2446.00M, pricepp: 611.50M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E4c86ecea41d765c50807040abbeaa09d", inboundRouteId: "E810e65378191ee812b71b84dfdba31ea").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2446.00M, pricepp: 611.50M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E4c86ecea41d765c50807040abbeaa09d", inboundRouteId: "E810e65378191ee812b71b84dfdba31ea").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2446.00M, pricepp: 611.50M, date: new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E4c86ecea41d765c50807040abbeaa09d", inboundRouteId: "E810e65378191ee812b71b84dfdba31ea").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2978.00M, pricepp: 744.50M, date: new DateTime(2024, 10, 28, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 951.00M, roomPricePP: 317.00m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 540.00M, roomPricePP: 540.00M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E12ea7020529cc3d9c658271c929e71b5", inboundRouteId: "Ed899f6e1898421e6d7046c724bad226b").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 3211.68M, pricepp: 802.92M, date: new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1106.36M, roomPricePP: 368.79m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 590.32M, roomPricePP: 590.32M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E457ee21488f6bd77abd28829c86cf0d8", inboundRouteId: "Ef5b202b486097685fbc949f536131f2a").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2704.68M, pricepp: 676.17M, date: new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1106.36M, roomPricePP: 368.79m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 590.32M, roomPricePP: 590.32M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E457ee21488f6bd77abd28829c86cf0d8", inboundRouteId: "E916afc2046e157dddf00d2045d565c6b").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 3147.68M, pricepp: 786.92M, date: new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1106.36M, roomPricePP: 368.79m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 590.32M, roomPricePP: 590.32M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E917c8b566adbe77fc39286600c651b7a", inboundRouteId: "Ef5b202b486097685fbc949f536131f2a").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2640.68M, pricepp: 660.17M, date: new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1106.36M, roomPricePP: 368.79m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 590.32M, roomPricePP: 590.32M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E917c8b566adbe77fc39286600c651b7a", inboundRouteId: "E916afc2046e157dddf00d2045d565c6b").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2383.20M, pricepp: 595.80M, date: new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1144.16M, roomPricePP: 381.39m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 597.04M, roomPricePP: 597.04M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "2230011180/1002528", inboundRouteId: "2230319189/1028973").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 2480.20M, pricepp: 620.05M, date: new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 1144.16M, roomPricePP: 381.39m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 597.04M, roomPricePP: 597.04M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E7551ad7be79960f5846fbc9a4b876cac", inboundRouteId: "E3e6a40616d820edec66d35b6a1be2aee").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1839.79M, pricepp: 459.95M, date: new DateTime(2024, 11, 02, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E30363e6e26e5b555e572d0e86e480bd9", inboundRouteId: "E06d952a6728baa94288bf22f7e074fd6").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1839.79M, pricepp: 459.95M, date: new DateTime(2024, 11, 02, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E412ab10b7dd3a94b17f0e1fdaa3c37e9", inboundRouteId: "E06d952a6728baa94288bf22f7e074fd6").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1765.79M, pricepp: 441.45M, date: new DateTime(2024, 11, 03, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "2230011948/1002592", inboundRouteId: "2230319982/1029039").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1823.79M, pricepp: 455.95M, date: new DateTime(2024, 11, 03, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E56cdba243a91f064b75f8a49283d93cb", inboundRouteId: "Eabbc1fb30958d385665b8a25ea85dd50").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1823.79M, pricepp: 455.95M, date: new DateTime(2024, 11, 03, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E56cdba243a91f064b75f8a49283d93cb", inboundRouteId: "Eabbc1fb30958d385665b8a25ea85dd50").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1775.79M, pricepp: 443.95M, date: new DateTime(2024, 11, 04, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "E1aab2554bb66ee984cd5e5c7f5809848", inboundRouteId: "E5048c005bc61b8ced4a15b9ba0703223").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1921.79M, pricepp: 480.45M, date: new DateTime(2024, 11, 06, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "2230010940/1002508", inboundRouteId: "2230320762/1029104").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1781.79M, pricepp: 445.45M, date: new DateTime(2024, 11, 07, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "2230011192/1002529", inboundRouteId: "2230319201/1028974").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1754.79M, pricepp: 438.70M, date: new DateTime(2024, 11, 09, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "Ef5f5db041279640bde4b942da3d3b0ea", inboundRouteId: "Ead46f25a08f44235b352daaa0f055616").Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1725.79M, pricepp: 431.45M, date: new DateTime(2024, 11, 10, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "MAAG0012")
                        .WithUnit(roomCode: "DB01", roomPrice: 751.63M, roomPricePP: 250.54m, roomBoard: "AI", adult: 2, children: 1, infant: 0)
                        .WithUnit(roomCode: "DB01", roomPrice: 448.16M, roomPricePP: 448.16M, roomBoard: "AI", adult: 1, children: 0, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-27", depDate: "2024-10-27", arrTime: "2200", depTime: "2200", outboundRouteId: "2230011960/1002593", inboundRouteId: "2230319994/1029040").Build())
                    .Build(),
            },
            new Hotel(){ StarRating = "4" },
            new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer
                    {
                        Price = 2446, PricePP = 611.50M, Board = "AI", Date = new DateTime(2024, 10, 27, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "E4c86ecea41d765c50807040abbeaa09d",
                        InboundRouteId ="E810e65378191ee812b71b84dfdba31ea",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 2978, PricePP = 744.50M, Board = "AI", Date = new DateTime(2024, 10, 28, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "E12ea7020529cc3d9c658271c929e71b5",
                        InboundRouteId = "Ed899f6e1898421e6d7046c724bad226b",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer { Date = new DateTime(2024, 10, 29, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 2640.68M, PricePP = 660.17M, Board = "AI", Date = new DateTime(2024, 10, 30, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "E917c8b566adbe77fc39286600c651b7a",
                        InboundRouteId ="E916afc2046e157dddf00d2045d565c6b",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 2383.20M, PricePP = 595.80M, Board = "AI", Date = new DateTime(2024, 10, 31, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "2230011180/1002528",
                        InboundRouteId ="2230319189/1028973",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer { Date = new DateTime(2024, 11, 01, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1839.79M, PricePP = 459.95M, Board = "AI", Date = new DateTime(2024, 11, 02, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "E30363e6e26e5b555e572d0e86e480bd9",
                        InboundRouteId = "E06d952a6728baa94288bf22f7e074fd6",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1765.79M, PricePP = 441.45M, Board = "AI", Date = new DateTime(2024, 11, 03, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "2230011948/1002592",
                        InboundRouteId = "2230319982/1029039",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1775.79M, PricePP = 443.95M, Board = "AI", Date = new DateTime(2024, 11, 04, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "E1aab2554bb66ee984cd5e5c7f5809848",
                        InboundRouteId = "E5048c005bc61b8ced4a15b9ba0703223",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer { Date = new DateTime(2024, 11, 05, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1921.79M, PricePP = 480.45M, Board = "AI", Date = new DateTime(2024, 11, 06, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "2230010940/1002508",
                        InboundRouteId = "2230320762/1029104",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1781.79M, PricePP = 445.45M, Board = "AI", Date = new DateTime(2024, 11, 07, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "2230011192/1002529",
                        InboundRouteId = "2230319201/1028974",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer { Date = new DateTime(2024, 11, 08, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1754.79M, PricePP = 438.70M, Board = "AI", Date = new DateTime(2024, 11, 09, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "Ef5f5db041279640bde4b942da3d3b0ea",
                        InboundRouteId = "Ead46f25a08f44235b352daaa0f055616",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price =  1725.79M, PricePP = 431.45M, Board = "AI", Date = new DateTime(2024, 11, 10, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = "2230011960/1002593",
                        InboundRouteId = "2230319994/1029040",
                        AccommodationId = "MAAG0012",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "DB01"
                            },
                            new()
                            {
                                RoomCode = "DB01"
                            }
                        }
                    },
                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

internal sealed class PriceGraphClassDataMultiRoomExtactMatch : IEnumerable<object[]>
{
    private static string OutboundRouteId => "E2994e9d0707a84abadad895bf104c084";
    private static string InboundRouteId => "Eb30ee466e825190a7334a1586bbf3a89";

    private readonly List<object[]> _data = new List<object[]>
    {
        new object[]
        {
            OrchestratorBuilder.PriceGraphRequestBuilder(startDate: "2024-09-19",
                initialDate: "2024-09-19",
                departure: "BHX",
                roomAllocations: new List<RoomAllocation>
                {
                    new RoomAllocation { Adults = 1, Children = 2, RoomCode = "TW02" },
                    new RoomAllocation { Adults = 2, Children = 2, RoomCode = "DB02" }
                },
                accommodationId: "ESDO0029",
                boardType:"BB"),
            new SearchAvailablePackagesRequest { },
            new MarketSettings(),
            new List<AvCacheResultOffersOffer>
            {
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 2, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 2, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 2, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 2, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
                new AtComBuilders.AvCacheResultOffersOfferResponseBuilder()
                    .With(price: 1800, pricepp: 900, date: new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc))
                    .WithAccommadation(new AtComBuilders.AtcomAccommadationResponseBuilder()
                        .WithAccommadation(accomId: "ESDO0029")
                        .WithUnit(roomCode: "TW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 1, children: 2, infant: 0)
                        .WithUnit(roomCode: "ATW02", roomPrice: 1500, roomPricePP: 750, roomBoard: "BB", adult: 2, children: 2, infant: 0)
                        .Build())
                    .WithTransport(new AtComBuilders.AtcomTransportResponseBuilder()
                        .WithRoute(arrDate:"2024-10-02", depDate: "2024-10-01", arrTime: "2200", depTime: "2200", outboundRouteId: OutboundRouteId, inboundRouteId: InboundRouteId).Build())
                    .Build(),
            },
            new Hotel(){StarRating = "4"},
            new PriceGraphResponse
            {
                Offers = new()
                {
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 12, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 13, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 14, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 15, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 16, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 17, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 18, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 19, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "TW02"
                            },
                            new()
                            {
                                RoomCode = "ATW02"
                            }
                        }
                    },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 20, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 21, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer{ Date = new DateTime(2024, 09, 22, 0, 0, 0, DateTimeKind.Utc) },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 23, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "ATW02"
                            },
                            new()
                            {
                                RoomCode = "ATW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 24, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "ATW02"
                            },
                            new()
                            {
                                RoomCode = "ATW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 25, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "ATW02"
                            },
                            new()
                            {
                                RoomCode = "ATW02"
                            }
                        }
                    },
                    new AlternativeOffer
                    {
                        Price = 1800, PricePP = 900, Board = "BB", Date = new DateTime(2024, 09, 26, 0, 0, 0, DateTimeKind.Utc),
                        OutboundRouteId = OutboundRouteId,
                        InboundRouteId =InboundRouteId,
                        AccommodationId = "ESDO0029",
                        Rooms = new()
                        {
                            new()
                            {
                                RoomCode = "ATW02"
                            },
                            new()
                            {
                                RoomCode = "ATW02"
                            }
                        }
                    }
                }
            }
        }
    };

    public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

}

internal static class OrchestratorBuilder
{
    public static Offer CreateOffer(DateTime offerDate, decimal price, decimal pricePP, int adults, int children, int infants, string board, string roomCode) =>
        new Offer
        {
            Date = offerDate,
            Price = price,
            PricePP = pricePP,

            Accom = new Accom
            {
                Code = "ESDO0029",
                Unit = new()
                {
                    new Unit() { Occupation = new Occupation{ Adults = adults, Children = children, Infants = infants }, Board = board, Code =  roomCode}
                },
            }
        };

    public static PriceGraphRequest PriceGraphRequestBuilder(string startDate, string initialDate, string departure, List<RoomAllocation> roomAllocations, string accommodationId, string boardType) =>
        new PriceGraphRequest()
        {
            StartDate = startDate,
            InitialDate = initialDate,
            Departure = departure,
            Room = roomAllocations,
            AccommodationIds = accommodationId,
            BoardType = boardType
        };

    public static PriceGraphMonthRequest PriceGraphMonthRequestBuilder(string startDate, string endDate, string departure, List<RoomAllocation> roomAllocations, string accommodationId, string boardType) =>
        new PriceGraphMonthRequest()
        {
            Start = startDate,
            StartDate = startDate,
            End = endDate,
            Departure = departure,
            Room = roomAllocations,
            AccommodationIds = accommodationId,
            BoardType = boardType
        };
}

internal class AtComBuilders
{
    internal class AvCacheResultOffersOfferAccomBuilder
    {
        public AvCacheResultOffersOfferAccom Build() => new AvCacheResultOffersOfferAccom();
    }

    internal class AvCacheResultOffersOfferAccomExtendedBuilder
    {
        public AvCacheResultOffersOfferAccomExtended Build(AvCacheResultOffersOfferAccom avCacheResultOffersOfferAccom) => new AvCacheResultOffersOfferAccomExtended(avCacheResultOffersOfferAccom);
    }

    internal class AvCacheResultOffersOfferExtendedBuilder
    {
        public AvCacheResultOffersOfferExtended Build(AvCacheResultOffersOffer avCacheResultOffersOffer, IEnumerable<AvCacheResultOffersOfferAccomExtended> avCacheResultOffersOfferAccomExtended) =>
            new(avCacheResultOffersOffer, avCacheResultOffersOfferAccomExtended);

        public AvCacheResultOffersOfferExtended Build() =>
            new();
    }

    internal class AvCacheResultOffersOfferResponseBuilder
    {
        private AvCacheResultOffersOffer avCacheResultOffersOffer { get; set; } = new();

        public AvCacheResultOffersOfferResponseBuilder WithAccommadation(AvCacheResultOffersOfferAccom[] accom)
        {
            avCacheResultOffersOffer.Accom = accom;
            return this;
        }

        public AvCacheResultOffersOfferResponseBuilder WithTransport(AvCacheResultOffersOfferTransport avCacheResultOffersOfferTransport)
        {
            avCacheResultOffersOffer.Transport = avCacheResultOffersOfferTransport;
            return this;
        }

        public AvCacheResultOffersOfferResponseBuilder WithAltBoard(AvCacheResultOffersOfferBoard[] altBoards)
        {
            avCacheResultOffersOffer.AltBoard = altBoards;
            return this;
        }

        public AvCacheResultOffersOfferResponseBuilder With(decimal price = 0, decimal pricepp = 0, DateTime date = default)
        {
            avCacheResultOffersOffer.Price = price;
            avCacheResultOffersOffer.PricePP = pricepp;
            avCacheResultOffersOffer.Date = date;
            return this;
        }

        public AvCacheResultOffersOffer Build() => avCacheResultOffersOffer;
    }

    internal class AtcomAccommadationResponseBuilder
    {
        private AvCacheResultOffersOfferAccom avCacheResultOffersOfferAccom;
        private List<AvCacheResultOffersOfferAccomUnit> avCacheResultOffersOfferAccomUnits = new();

        public AtcomAccommadationResponseBuilder WithAccommadation(string accomId = null, string packageId = null, bool ext = false, string cty2 = null) =>
            new AtcomAccommadationResponseBuilder() 
            { avCacheResultOffersOfferAccom = new() { AtcomId = packageId, Code = accomId, ExtSpecified = ext, Ext = ext ? YesNo.Y : YesNo.N, Cty2 = cty2 } };

        public AtcomAccommadationResponseBuilder WithUnit(string roomCode = default, byte adult = 100, byte children = 100, byte infant = 100,
            decimal? roomPrice = null, decimal? roomPricePP = null, string roomBoard = null, string system = null, string extRoomCode = null, string extBoardCode = null)
        {
            avCacheResultOffersOfferAccomUnits.Add(new()
            {
                Code = roomCode,
                Occ = new()
                {
                    Ad = adult,
                    Ch = children,
                    In = infant
                },
                Price = roomPrice ?? 100,
                PricePP = roomPricePP ?? 100,
                Board = roomBoard,
                SrcInfo = system == null
                                    ? null
                                    : new()
                                    {
                                        System = system,
                                        Unit = extRoomCode,
                                        Board = extBoardCode,
                                    },
            });
            return this;
        }

        public AvCacheResultOffersOfferAccom[] Build()
        {
            avCacheResultOffersOfferAccom.Unit = avCacheResultOffersOfferAccomUnits.ToArray();
            return [avCacheResultOffersOfferAccom];
        }
    }

    internal class AtcomTransportResponseBuilder
    {
        private AvCacheResultOffersOfferTransport avCacheResultOffersOfferTransport = new();

        public AtcomTransportResponseBuilder WithRoute(string arrDate, string depDate, string arrTime, string depTime, string outboundRouteId, string inboundRouteId)
        {
            var routes = new List<AvCacheResultOffersOfferTransportRoute>() {
            new() {
                Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                ArrDate = DateTime.Parse(arrDate, CultureInfo.InvariantCulture),
                DepDate = DateTime.Parse(depDate, CultureInfo.InvariantCulture),
                DepTime = depTime,
                ArrTime = arrTime,
                AtcomId = outboundRouteId
            },
            new() {
                Dir = AvCacheResultOffersOfferTransportRouteDir.I,
                ArrDate = DateTime.Parse(arrDate, CultureInfo.InvariantCulture),
                DepDate = DateTime.Parse(depDate, CultureInfo.InvariantCulture),
                DepTime = depTime,
                ArrTime = arrTime,
                AtcomId = inboundRouteId
            }
        };

            avCacheResultOffersOfferTransport.Route = routes.ToArray();

            return this;
        }

        public AvCacheResultOffersOfferTransport Build()
        {
            return avCacheResultOffersOfferTransport;
        }
    }
}