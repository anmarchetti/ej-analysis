using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

public class SearchAvailablePackagesFilterAndMapperFlightDurationFilterTests
{
    private readonly SearchAvailablePackagesFilterAndMapper _sut;

    public SearchAvailablePackagesFilterAndMapperFlightDurationFilterTests()
    {
        var fixture = MapperTestsHelper.PrepareMapperFixture();
        _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
    }

    [Theory]
    [MemberData(nameof(FlightDurationFilterData))]
    public async Task FlightDurationFilter(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, string[] expectedResults)
    {
        // Act
        var res = await _sut.MapWithFilters(offers, request, false);

        // Assert
        res.Should().NotBeNull();
        var accoms = res.SearchOffersResponse.Offers.Select(x => x.Accom.Id).ToList();
        accoms.Should().BeEquivalentTo(expectedResults);
    }

    public static List<object[]> FlightDurationFilterData()
    {
        var offers = new List<AvCacheResultOffersOfferExtended>()
        {
            CreateOffer("X9907814", 75, 65),
            CreateOffer("ESMN0023", 140, 150),
            CreateOffer("ESCB0022", 155, 150),
            CreateOffer("GRSK0009", 210, 235),
            CreateOffer("TRDL0048", 250, 260),
        };

        var testCases = new List<object[]>
        {
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationFrom = 200, Duration =[4] },
                new string[] { "GRSK0009" , "TRDL0048" }
            },
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationTo = 160, Duration =[4] },
                new string[] { "X9907814", "ESMN0023", "ESCB0022" }
            },
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationFrom = 100, FlightDurationTo = 200, Duration = [4] },
                new string[] { "ESMN0023" , "ESCB0022" }
            },
            //only longest of 2 flights should be checked by filter
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationFrom = 220, FlightDurationTo = 240, Duration = [4] },
                new string[] { "GRSK0009" }
            },
            //only longest of 2 flights should be checked by filter
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationFrom = 200, FlightDurationTo = 220, Duration = [4] },
                new string[] { }
            },
            //upper bounds filter is inclusive
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationFrom = 260, Duration = [4] },
                new string[] { "TRDL0048" }
            },
            //lower bounds filter is inclusive
            new object[]
            {
                offers,
                new PackagesSearchRequest { FlightDurationTo = 150, Duration = [4]  },
                new string[] { "X9907814", "ESMN0023" }
            }
        };

        return testCases;
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(string accomId, int outboundFlightDuration, int inboudFlightDuration)
    {
        var offer = new AvCacheResultOffersOffer
        {
            Transport = new AvCacheResultOffersOfferTransport
            {
                JnyDurOut = MinutesToAtcomDuration(outboundFlightDuration),
                JnyDurRet = MinutesToAtcomDuration(inboudFlightDuration)
            }
        };

        var accom = new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom
        {
            Prom = "ASDE",
            Cty2 = "DEMU",
            Id = accomId,
        });
        var offerExtended = new AvCacheResultOffersOfferExtended(offer, new[] { accom });
        return offerExtended;
    }

    private static decimal MinutesToAtcomDuration(int minutes)
    {
        var hours = minutes / 60;
        var mins = minutes % 60;
        return hours * 100 + mins;
    }
}
