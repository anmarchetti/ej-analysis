using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class PaxMixAdultsOnlyFilterTests
{
    private PaxMixAdultsOnlyFilter _sut;

    public PaxMixAdultsOnlyFilterTests()
    {
        IOptions<CmsSettings> options = Options.Create<CmsSettings>(new CmsSettings { FacilityMatrix = new() { AdultHolidayCode = "adu" } });
        _sut = new PaxMixAdultsOnlyFilter(options);
    }

    [Theory]
    [MemberData(nameof(GetOffers_Data))]
    public async Task FilterBy_Async(IList<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, int expectedCount)
    {
        AssertionOptions.FormattingOptions.MaxDepth = 100;

        var results = await _sut.FilterBy(offers.ToList(), request);

        results.Count.Should().Be(expectedCount);
    }

    [Theory]
    [MemberData(nameof(GetOffers_Data))]
    public async Task GetOptions_ShouldReturnZero_Always(IList<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, int alwaysZero)
    {
        var results = await _sut.GetOptions(offers.ToList(), request, null);

        alwaysZero = 0;
        results.Options.Count.Should().Be(alwaysZero);
    }

    public static TheoryData<List<AvCacheResultOffersOfferExtended>, PackagesSearchRequest, int> GetOffers_Data() => new()
        {
            {
                new()
                {
                    new AvCacheResultOffersOfferExtended(
                        new(),
                        [
                            new AvCacheResultOffersOfferAccomExtended(new())
                            {
                                FacilityMatrix = [new HotelType() { Code = "adu" }]
                            }
                        ])
                },
                new(),
                1
            },
            {
                new()
                {
                    new AvCacheResultOffersOfferExtended(
                        new(),
                        [
                            new AvCacheResultOffersOfferAccomExtended(new())
                            {
                                FacilityMatrix = [new HotelType() { Code = "adu" }]
                            }
                        ])
                },
                new(){ChildAges = "2,3"},
                0
            },
            {
                new()
                {
                    new AvCacheResultOffersOfferExtended(
                        new(),
                        [
                            new AvCacheResultOffersOfferAccomExtended(new())
                            {
                                FacilityMatrix = [new HotelType() { Code = "adu" }]
                            }
                        ])
                },
                new(){ Room =  new List<RoomAllocation>() { new() { Children = 1 } } },
                0
            }
        };
}
