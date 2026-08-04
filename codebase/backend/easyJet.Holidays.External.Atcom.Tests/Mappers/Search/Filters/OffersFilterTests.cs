using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters
{
    public class OffersFilterTests
    {
        private readonly Mock<IReferenceDataService> _dataServiceMock;
        private readonly OffersFilter _sut;

        public OffersFilterTests()
        {
            _dataServiceMock = new Mock<IReferenceDataService>();
            _dataServiceMock.Setup(x => x.GetDiscountSettings()).ReturnsAsync(new DiscountSettings { DiscountThreshold = 1 });
            _sut = new OffersFilter(_dataServiceMock.Object);
        }

        [Theory]
        [MemberData(nameof(FilterByData))]
        public async Task FilterBy(OfferFilterOptions filterOptions, List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request, List<AvCacheResultOffersOfferExtended> expectedResult, string reason)
        {
            // Arrange
            _dataServiceMock.Setup(x => x.GetOfferFilterOptions()).ReturnsAsync(filterOptions);

            // Act
            var res = await _sut.FilterBy(offers, request);

            // Assert
            res.Should().BeEquivalentTo(expectedResult, reason);
        }

        public static IEnumerable<object[]> FilterByData()
        {
            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "minds", Enabled = true, Value = "40"},
                    new OfferFilterOption { Code = "maxds", Enabled = true, Value = "20"}}},
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(30), CreateOffer(41) },
                new PackagesSearchRequest() { Offers = "minds,maxds" },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(41) },
                "Should take into account both filters"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "maxds", Enabled = true, Value = "20"}}},
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(19), CreateOffer(20), CreateOffer(21) },
                new PackagesSearchRequest() { Offers = "maxds" },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(19), CreateOffer(20) },
                "Up to filter is inclusive"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "minds", Enabled = true, Value = "20"}}},
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(19), CreateOffer(20), CreateOffer(21) },
                new PackagesSearchRequest() { Offers = "minds" },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(21) },
                "Over filter is exclusive"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "minds", Enabled = false, Value = "40"},
                    new OfferFilterOption { Code = "maxds", Enabled = false, Value = "20"}}},
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(30), CreateOffer(40) },
                new PackagesSearchRequest() { Offers = "minds,maxds" },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(30), CreateOffer(40) },
                "Filters disabled in sitecore don't apply even if they are in request"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "minds", Enabled = true, Value = "40"},
                    new OfferFilterOption { Code = "maxds", Enabled = true, Value = "20"}}},
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(30), CreateOffer(40) },
                new PackagesSearchRequest() { Offers = "" },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(20), CreateOffer(30), CreateOffer(40) },
                "Filters not in request don't apply"
            };
        }

        [Theory]
        [MemberData(nameof(GetOptionsData))]
        public async Task GetOptions(OfferFilterOptions filterOptions, List<AvCacheResultOffersOfferExtended> offers,
            FilterOptions expectedResult, string reason)
        {
            // Arrange
            _dataServiceMock.Setup(x => x.GetOfferFilterOptions()).ReturnsAsync(filterOptions);
            ApplyAllFiltersFunc applyAllOtherFilters = (List<AvCacheResultOffersOfferExtended> set, PackagesSearchRequest request) => { return Task.FromResult(set); };

            // Act
            var res = await _sut.GetOptions(offers, null, applyAllOtherFilters);

            // Assert
            res.Should().BeEquivalentTo(expectedResult, reason);
        }

        public static IEnumerable<object[]> GetOptionsData()
        {
            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "ffk", Enabled = true, Name = "Free for kids" },
                    new OfferFilterOption { Code = "minds", Enabled = true, Value = "40", Name = "Holidays with over 40 GBP off" },
                    new OfferFilterOption { Code = "maxds", Enabled = true, Value = "20", Name = "Holidays with up to 20 GBP off" }}},
                new List<AvCacheResultOffersOfferExtended> { CreateFreeForKidsOffer(), CreateOffer(15), CreateOffer(20), CreateOffer(30), CreateOffer(45) },
                new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption {Code = "ffk", Name = "Free for kids", Count = 1},
                        new FilterOption {Code = "minds", Name = "Holidays with over 40 GBP off", Count = 1},
                        new FilterOption {Code = "maxds", Name = "Holidays with up to 20 GBP off", Count = 2},
                    }
                },
                "Filter options counted correctly when enabled"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "ffk", Enabled = false, Name = "Free for kids" },
                    new OfferFilterOption { Code = "minds", Enabled = false, Value = "40", Name = "Holidays with over 40 GBP off" },
                    new OfferFilterOption { Code = "maxds", Enabled = true, Value = "20", Name = "Holidays with up to 20 GBP off" }}},
                new List<AvCacheResultOffersOfferExtended> { CreateFreeForKidsOffer(), CreateOffer(15), CreateOffer(20), CreateOffer(30), CreateOffer(45) },
                new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption {Code = "maxds", Name = "Holidays with up to 20 GBP off", Count = 2},
                    }
                },
                "Only enabled filters are present in filter options"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "ffk", Enabled = false, Name = "Free for kids" },
                    new OfferFilterOption { Code = "minds", Enabled = true, Value = "40", Name = "Holidays with over 40 GBP off" },
                    new OfferFilterOption { Code = "maxds", Enabled = false, Value = "20", Name = "Holidays with up to 20 GBP off" }}},
                new List<AvCacheResultOffersOfferExtended> { CreateFreeForKidsOffer(), CreateOffer(15), CreateOffer(20), CreateOffer(30), CreateOffer(45) },
                new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption {Code = "minds", Name = "Holidays with over 40 GBP off", Count = 1},
                    }
                },
                "Only enabled filters are present in filter options"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "ffk", Enabled = true, Name = "Free for kids" },
                    new OfferFilterOption { Code = "minds", Enabled = false, Value = "40", Name = "Holidays with over 40 GBP off" },
                    new OfferFilterOption { Code = "maxds", Enabled = false, Value = "20", Name = "Holidays with up to 20 GBP off" }}},
                new List<AvCacheResultOffersOfferExtended> { CreateFreeForKidsOffer(), CreateOffer(15), CreateOffer(20), CreateOffer(30), CreateOffer(45) },
                new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption {Code = "ffk", Name = "Free for kids", Count = 1},
                    }
                },
                "Only enabled filters are present in filter options"
            };

            yield return new object[] {
                new OfferFilterOptions { Filters = new List<OfferFilterOption> {
                    new OfferFilterOption { Code = "ffk", Enabled = false, Name = "Free for kids" },
                    new OfferFilterOption { Code = "minds", Enabled = false, Value = "40", Name = "Holidays with over 40 GBP off" },
                    new OfferFilterOption { Code = "maxds", Enabled = false, Value = "20", Name = "Holidays with up to 20 GBP off" }}},
                new List<AvCacheResultOffersOfferExtended> { CreateFreeForKidsOffer(), CreateOffer(15), CreateOffer(20), CreateOffer(30), CreateOffer(45) },
                FilterOptions.Empty,
                "When all filters are disabled filter options are empty"
            };
        }

        private static AvCacheResultOffersOfferExtended CreateOffer(decimal discount)
        {
            return new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer()
                        {

                        },
                        new List<AvCacheResultOffersOfferAccomExtended>()
                        {
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                            {
                                Unit = new AvCacheResultOffersOfferAccomUnit[1]{ new AvCacheResultOffersOfferAccomUnit() { Disc = discount } }
                            })
                        });
        }

        private static AvCacheResultOffersOfferExtended CreateFreeForKidsOffer()
        {
            return new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer()
                        {

                        },
                        new List<AvCacheResultOffersOfferAccomExtended>()
                        {
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                            {
                                Unit = new AvCacheResultOffersOfferAccomUnit[1]{ new AvCacheResultOffersOfferAccomUnit() { DcSpecified = true, Dc = YesNo.Y } }
                            })
                        });
        }

        private static AvCacheResultOffersOfferExtended CreateOfferWithMultipleUnits()
        {
            return new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer()
                        {

                        },
                        new List<AvCacheResultOffersOfferAccomExtended>()
                        {
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                            {
                                Unit = new AvCacheResultOffersOfferAccomUnit[]
                                { 
                                    new AvCacheResultOffersOfferAccomUnit() { DcSpecified = true, Dc = YesNo.Y },
                                    new AvCacheResultOffersOfferAccomUnit() { DcSpecified = true, Dc = YesNo.Y },
                                    new AvCacheResultOffersOfferAccomUnit() { DcSpecified = false, Dc = YesNo.N }
                                }
                            })
                        });
        }
    }
}
