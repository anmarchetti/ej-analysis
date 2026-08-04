using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Models;
using easyJet.Holidays.External.Apollo.Models.Base;
using easyJet.Holidays.External.Apollo.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Tests.Services;

public class ApolloServiceTests
{
    [Fact]
    public void Constructor_WhenSettingsProvided_DoesNotThrow()
    {
        var exception = Record.Exception(() =>
            new ApolloService(
                new Mock<IApolloAwsRequestTemplate>().Object,
                CreateEndpointsProvider(),
                new HttpContextAccessor(),
                Options.Create(new ApolloSettings
                {
                    DefaultBookingFields = [],
                    Api = new ApolloApiSettings { GraphQl = "/graphql" },
                    Host = "https://apollo.example.com"
                }),
                new Mock<ICacheService>().Object,
                Options.Create(new CacheSettings { Buckets = new Buckets { ApolloBookingsCache = "apollo-bookings" } }),
                new Mock<ILogger<ApolloService>>().Object));

        Assert.Null(exception);
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_BuildsEncryptedMemberIdFilterInQuery()
    {
        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>
            {
                Data = new ApolloBookingsData<ApolloUpcomingBooking>
                {
                    Bookings = new ApolloUpcomingBookingsConnection
                    {
                        Items =
                        [
                            new ApolloUpcomingBooking
                            {
                                Reference = "EJH123",
                                Destinations = [new ApolloBookingDestination { Hotel = new ApolloBookingHotel() }],
                                Holiday = new ApolloBookingHoliday()
                            }
                        ]
                    }
                }
            });

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                "apollo-bookings",
                It.Is<ICollection<string>>(k =>
                    k.Count == 2
                    && k.ElementAt(0) == "ApolloGraphQlBookingsByEncryptedMemberId"
                    && k.ElementAt(1) == "enc-123"),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        Assert.Single(result.Bookings);
        requestTemplate.Verify(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
            It.IsAny<Uri>(),
                It.Is<ApolloGraphQlRequest>(r =>
                    r.OperationName == "BookingsByEncryptedMemberId"
                    && r.Query.Contains("filter: \n  {\n   encryptedMemberId: { eq: $encryptedMemberId }\n   status: { eq: \"BKG\" }\n   bookingType: { eq: \"LIVE\" }\n  }", StringComparison.Ordinal)
                    && r.Query.Contains("destinations {", StringComparison.Ordinal)
                    && r.Query.Contains("holiday {", StringComparison.Ordinal)
                    && r.Query.Contains("outbound {", StringComparison.Ordinal)
                    && r.Query.Contains("flightDepartureDatetimeLocal", StringComparison.Ordinal)
                    && r.Query.Contains("flightDepartureDatetimeUtc", StringComparison.Ordinal)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenFieldsMissing_UsesDefaults()
    {
        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>
            {
                Data = new ApolloBookingsData<ApolloUpcomingBooking>
                {
                    Bookings = new ApolloUpcomingBookingsConnection
                    {
                        Items = [new ApolloUpcomingBooking { Reference = "EJH222" }]
                    }
                }
            });

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        var booking = Assert.Single(result.Bookings);
        Assert.Equal("EJH222", booking.BookingReference);
        Assert.Equal(string.Empty, booking.HotelCode);
        Assert.Equal(string.Empty, booking.HotelName);
        Assert.Equal(string.Empty, booking.HotelLocation);
        Assert.Equal(default, booking.HolidayDateStartLocal);
        Assert.Equal(default, booking.HolidayDateEndLocal);
        Assert.Equal(0, booking.HolidayNightsCount);
        Assert.Equal(default, booking.DepartureDatetimeLocal);
        Assert.Equal(default, booking.DepartureDatetimeUtc);
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenLocationProvided_UsesLocationNameHierarchy()
    {
        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>
            {
                Data = new ApolloBookingsData<ApolloUpcomingBooking>
                {
                    Bookings = new ApolloUpcomingBookingsConnection
                    {
                        Items =
                        [
                            new ApolloUpcomingBooking
                            {
                                Reference = "EJHLOC1",
                                Destinations =
                                [
                                    new ApolloBookingDestination
                                    {
                                        Location = new ApolloBookingLocation
                                        {
                                            ResortName = "Benidorm",
                                            RegionName = "Costa Blanca",
                                            CountryName = "Spain"
                                        },
                                        Hotel = new ApolloBookingHotel
                                        {
                                            HotelLocation = "fallback location"
                                        }
                                    }
                                ],
                                Holiday = new ApolloBookingHoliday()
                            }
                        ]
                    }
                }
            });

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        var booking = Assert.Single(result.Bookings);
        Assert.Equal("Benidorm, Costa Blanca, Spain", booking.HotelLocation);
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenOutboundProvided_MapsOutboundFields()
    {
        var departureLocal = new DateTime(2026, 6, 1, 8, 30, 0, DateTimeKind.Unspecified);
        var departureUtc = new DateTime(2026, 6, 1, 7, 30, 0, DateTimeKind.Utc);

        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>
            {
                Data = new ApolloBookingsData<ApolloUpcomingBooking>
                {
                    Bookings = new ApolloUpcomingBookingsConnection
                    {
                        Items =
                        [
                            new ApolloUpcomingBooking
                            {
                                Reference = "EJHOUT1",
                                Destinations = [new ApolloBookingDestination { Hotel = new ApolloBookingHotel() }],
                                Holiday = new ApolloBookingHoliday(),
                                Outbound = new ApolloOutboundFlight
                                {
                                    FlightDepartureDatetimeLocal = departureLocal,
                                    FlightDepartureDatetimeUtc = departureUtc,
                                }
                            }
                        ]
                    }
                }
            });

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        var booking = Assert.Single(result.Bookings);
        Assert.Equal(departureLocal, booking.DepartureDatetimeLocal);
        Assert.Equal(departureUtc, booking.DepartureDatetimeUtc);
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenGraphQlHasErrors_ReturnsEmptyResult()
    {
        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>
            {
                Errors = [new ApolloGraphQlError { Message = "failed" }]
            });

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        Assert.NotNull(result.Bookings);
        Assert.Empty(result.Bookings);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenIdInvalid_ThrowsArgumentException(string? encryptedMemberId)
    {
        var sut = CreateSut(new Mock<IApolloAwsRequestTemplate>().Object, new Mock<ICacheService>().Object);

        await Assert.ThrowsAsync<ArgumentException>(() => sut.GetUpcomingBookingsByEncryptedMemberId(encryptedMemberId!));
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenLimitNotPositive_ThrowsArgumentOutOfRangeException()
    {
        var sut = CreateSut(new Mock<IApolloAwsRequestTemplate>().Object, new Mock<ICacheService>().Object);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => sut.GetUpcomingBookingsByEncryptedMemberId("enc-123", 0));
    }

    [Fact]
    public async Task GetUpcomingBookingsByEncryptedMemberId_WhenRequestThrows_ReturnsEmptyResult()
    {
        var requestTemplate = new Mock<IApolloAwsRequestTemplate>();
        requestTemplate
            .Setup(x => x.GetGraphQlResponseAsync<ApolloGraphQlResponse<ApolloBookingsData<ApolloUpcomingBooking>>>(
                It.IsAny<Uri>(),
                It.IsAny<ApolloGraphQlRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("request failed"));

        var cacheService = new Mock<ICacheService>();
        cacheService
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<UpcomingBookingsModel>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<UpcomingBookingsModel>>, bool>(async (_, _, factory, _) => await factory());

        var sut = CreateSut(requestTemplate.Object, cacheService.Object);

        var result = await sut.GetUpcomingBookingsByEncryptedMemberId("enc-123");

        Assert.NotNull(result.Bookings);
        Assert.Empty(result.Bookings);
    }

    private static ApolloService CreateSut(IApolloAwsRequestTemplate requestTemplate, ICacheService cacheService)
    {
        return new ApolloService(
            requestTemplate,
            CreateEndpointsProvider(),
            new HttpContextAccessor { HttpContext = new DefaultHttpContext() },
            Options.Create(new ApolloSettings
            {
                Host = "https://apollo.example.com",
                Api = new ApolloApiSettings { GraphQl = "/graphql" },
                DefaultBookingFields = []
            }),
            cacheService,
            Options.Create(new CacheSettings { Buckets = new Buckets { ApolloBookingsCache = "apollo-bookings" } }),
            new Mock<ILogger<ApolloService>>().Object);
    }

    private static EndpointsProvider CreateEndpointsProvider()
    {
        var settings = Options.Create(new ApolloSettings
        {
            Host = "https://apollo.example.com",
            Api = new ApolloApiSettings { GraphQl = "/graphql" }
        });
        var envBehavior = Options.Create(new EnvironmentBehaviourSettings
        {
            AllowMockCookies = false
        });

        return new EndpointsProvider(
            settings,
            envBehavior,
            new Mock<ICookiesService>().Object,
            new Mock<ILogger<EndpointsProvider>>().Object);
    }
}
