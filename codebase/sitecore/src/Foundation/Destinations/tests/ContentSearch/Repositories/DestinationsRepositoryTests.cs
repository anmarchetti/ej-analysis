using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class DestinationsRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDestinationsLogger logger;

        public DestinationsRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            logger = Substitute.For<IDestinationsLogger>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [InlineData("code1")]
        public void SearchHotelsByIds_ShouldSearchHotelsByIds_IfHotelsExists(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            SourceCodes = new[] { code },
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchHotelsByCodes(new string[] { code, "code2" });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.First().Document.SourceCodes.Should().Contain(code);
                    result.Hits.First().Document.TemplateId.Should().Be(Constants.TemplateIds.Accommodation);
                }
            }
        }

        [Theory]
        [InlineData("code1", "transfer1", "transfer2", "transfer3")]
        public void SearchHotelTransfersByIds_ShouldSearchHotelTransfersByIds_IfHotelTransfersExists(string code, params string[] transfers)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            TemplateName = "Hotel",
                            SourceCodes = new[] { code },
                            Transfers = transfers,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchHotelTransfersByIds(new string[] { code, "code2" });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Transfers.Should().HaveCount(transfers.Length);
                    for (int i = 0; i < transfers.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.Transfers[i].Should().Be(transfers[i]);
                    }
                }
            }
        }

        [Theory]
        [InlineData("simple item name")]
        public void SearchByName_ShouldSearchSearchResults_IfItemsWithExpectedNameExists(string name)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDestinationsSearchResultItem>(new BaseDestinationsSearchResultItem[]
                {
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Country,
                            ItemName = name,
                            ShowOnDropdown = true,
                            ShowOnSearchPod = true,
                            ShowInAutocomplete = true,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new BaseDestinationsSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDestinationsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchByName(name, false, false);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.ItemName.Should().Be(name);
                }
            }
        }

        [Theory]
        [InlineData("simple item name")]
        public void SearchByNames_ShouldSearchSearchResults_IfItemsWithExpectedNamesExists(params string[] names)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDestinationsSearchResultItem>(names.Select(name =>
                {
                    return new BaseDestinationsSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Country,
                        ItemName = name,
                        ShowOnDropdown = true,
                        ShowOnSearchPod = true,
                        ShowInAutocomplete = true,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    };
                }));
                queryable.DefaultValues.Add(new BaseDestinationsSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDestinationsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchByNames(names.ToList());

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.ItemName.Should().Be(names[0]);
                }
            }
        }

        [Theory]
        [InlineData("code1", "simple item", "facility 1", "facility 2", "facility 3")]
        public void SearchHotelsFacilitiesByIds_ShouldSearchHotelsFacilitiesByIds_IfHotelsFacilitiesExists(string code, string name, params string[] filtredFacilities)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelFacilitiesSearchResultItem>(new HotelFacilitiesSearchResultItem[]
                {
                    new HotelFacilitiesSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            TemplateName = "Hotel",
                            Name = name,
                            SourceCodes = new[] { code },
                            FilteredFacilities = filtredFacilities,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new HotelFacilitiesSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<HotelFacilitiesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchHotelsFacilitiesByIds(new List<string> { code, "code2" });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                    result.Hits.FirstOrDefault().Document.FilteredFacilities.Should().HaveCount(filtredFacilities.Length);
                    for (int i = 0; i < filtredFacilities.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.FilteredFacilities[i].Should().Be(filtredFacilities[i]);
                    }
                }
            }
        }

        [Theory]
        [InlineData("code1", "code2")]
        public void GetAllCountries_ShouldReturnAllCountries_IfCountriesExists(string countryCode, string virtualCountryCode)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDestinationsSearchResultItem>(new BaseDestinationsSearchResultItem[]
                {
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.VirtualCountry,
                            Code = virtualCountryCode,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        },
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Country,
                            Code = countryCode,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new BaseDestinationsSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDestinationsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAllCountries(false, false);

                    // Assert
                    result.Hits.Should().HaveCount(2);
                }
            }
        }

        [Theory]
        [InlineData("code1", "giata code", "airport code1")]
        public void GetDestinationsByAirportCodes_ShouldReturnDestinationsByAirportCodes_IfDestinationsExists(string code, string giataCode, params string[] airportCodes)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDestinationsSearchResultItem>(new BaseDestinationsSearchResultItem[]
                {
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.VirtualCountry,
                            Code = code,
                            AirportCodes = airportCodes,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        },
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            GiataCode = giataCode,
                            Code = code,
                            AirportCodes = airportCodes,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new BaseDestinationsSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDestinationsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(airportCodes);

                    // Assert
                    result.Hits.Should().HaveCount(2);
                    foreach (var item in result.Hits)
                    {
                        item.Document.Code.Should().Be(code);
                        item.Document.AirportCodes.Should().HaveCount(airportCodes.Length);
                        if (item.Document.TemplateId == Constants.TemplateIds.Accommodation)
                        {
                            item.Document.GiataCode.Should().Be(giataCode);
                        }

                        for (int i = 0; i < airportCodes.Length; i++)
                        {
                            item.Document.AirportCodes[i].Should().Be(airportCodes[i]);
                        }
                    }
                }
            }
        }

        [Theory]
        [InlineData("code1", "nomatch", new[] { "nomatch", "nomatch" }, false, true)]
        [InlineData("nomatch", "code1", new[] { "nomatch", "nomatch" }, false, false)]
        [InlineData("nomatch", "nomatch", new[] { "code1", "nomatch" }, false, false)]
        [InlineData("code1", "code1", new[] { "code1", "nomatch" }, true, true)]
        [InlineData("nomatch", "nomatch", new[] { "nomatch", "nomatch" }, true, false)]
        public void SearchByCodes_ShouldReturnDestinations_IfDestinationsExists(string code, string giataCode, string[] sourceCodes, bool isHotel, bool isMatch)
        {
            var expectedCode = "code1";
            var nomatchCode = "nomatch";
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDestinationsSearchResultItem>(new BaseDestinationsSearchResultItem[]
                {
                    new BaseDestinationsSearchResultItem()
                        {
                            TemplateId = isHotel ? Constants.TemplateIds.Accommodation : Constants.TemplateIds.Country,
                            Code = code,
                            GiataCode = isHotel ? giataCode : null,
                            SourceCodes = isHotel ? sourceCodes : null,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new BaseDestinationsSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDestinationsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchByCodes(new List<string> { expectedCode });

                    // Assert
                    if (isMatch)
                    {
                        result.Hits.Should().HaveCount(1);
                        result.Hits.First().Document.Code.Should().Be(expectedCode);
                        if (isHotel)
                        {
                            result.Hits.First().Document.GiataCode.Should().Be(expectedCode);
                            result.Hits.First().Document.SourceCodes.Should().Contain(expectedCode);
                        }
                    }
                    else
                    {
                        result.Hits.Should().HaveCount(1);
                        result.Hits.First().Document.Code.Should().Be(nomatchCode);
                    }
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetParentByHotelsCode_ShouldReturnParent_IfParentExists(string code)
        {
            // Arrange
            var parentId = ID.NewID;
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Code = code,
                            Parent = parentId,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetParentByHotelsCode(code);

                    // Assert
                    result.Should().Be(parentId);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetAllRegions_ShouldReturnRegions(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.RegionPage,
                        Code = code,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.RegionCityPage,
                        Code = code,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.VirtualRegion,
                        Code = code,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAllRegions();

                    // Assert
                    result.Should().HaveCount(3);
                }
            }
        }

        [Theory]
        [InlineData("code1", "{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}")] // Country
        [InlineData("code2", "{2F42EC14-7E56-467A-B300-AB9723C74546}")] // Location
        [InlineData("code3", "{33B3542E-1316-40CA-8971-1CDB3C1D452D}")] // LocationCity
        [InlineData("code4", "{538939B3-07EC-4C23-BF8C-3A68DE0FDC93}")] // Resort
        [InlineData("code5", "{799ECB20-C605-4A6C-A32B-27222BDBB91E}")] // VirtualRegion
        [InlineData("code6", "{31FC60A9-A529-4081-BB33-7B1751F0BDAD}")] // VirtualResort
        public void GetDestinationItemByCode_ShouldReturnDestination(string code, string templateId)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var id = new ID(templateId);
                var destinationItem = new FakeItem().WithTemplate(id).WithField(Constants.FieldsIds.DatasourceItem.Code, code);
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem
                    {
                        TemplateId = id,
                        ItemId = destinationItem.ID,
                        Code = code,
                        SourceCodes = new[] { code },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                        Name = "Destination",
                        ItemName = "Destination"
                    }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationItemByCode(code);

                    // Assert
                    result.Should().NotBeNull();
                    result.Code.Should().Be(code);
                    result.TemplateId.Should().Be(id);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetDestinationItemByCode_ShouldNotReturnDestination_IfNothingIsFound(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var destinationItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithField(Constants.FieldsIds.DatasourceItem.Code, code);
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        ItemId = destinationItem.ID,
                        Code = code,
                        SourceCodes = new[] { code },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                        Name = "Destination",
                        ItemName = "Destination"
                    }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationItemByCode(code);

                    // Assert
                    result.Should().BeNull();
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetAllExistHotelsCodes_ShouldReturnParent_IfParentExists(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<SourcesSearchResultItem>(new[]
                {
                    new SourcesSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            SourceCodes = new[] { code },
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content"
                        }
                });
                queryable.DefaultValues.Add(new SourcesSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<SourcesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAllExistHotelsCodes(new[] { code });

                    // Assert
                    result.Should().HaveCount(1);
                    result.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsByGiataCodes_ShouldReturnHotels(List<string> giataCodes)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var searchResults = new List<BaseHotelSearchResultItem>();
                foreach (var giataCode in giataCodes)
                {
                    searchResults.Add(new BaseHotelSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { giataCode },
                        Code = giataCode,
                        GiataCode = giataCode,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    });
                }

                var queryable = new SearchProviderQueryableCollection<BaseHotelSearchResultItem>(searchResults);
                queryable.DefaultValues.Add(new BaseHotelSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<BaseHotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsByGiataCodes(giataCodes);

                    // Assert
                    result.Should().HaveCount(giataCodes.Count);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetAllExistHotelsCodes_ShouldReturnHotelCodes(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<SourcesSearchResultItem>(new[]
                {
                    new SourcesSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    }
                });
                queryable.DefaultValues.Add(new SourcesSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<SourcesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAllExistHotelsCodes();

                    // Assert
                    result.Should().HaveCount(1);
                    result.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetGiataToAccommodationCodesMapping_ShouldReturnHotels(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new[]
                {
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    }
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetGiataToAccommodationCodesMapping(new List<string>() { code });

                    // Assert
                    result.Should().HaveCount(1);
                    result.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                }
            }
        }

        [Theory]
        [InlineData("sitecore/content")]
        public void GetHotelsWithReviews_ShouldReturnHotels(string startPath)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelWithReviewSearchResultItem>(new[]
                {
                    new HotelWithReviewSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        ItemName = "Hotel",
                        StarRating = 5,
                        HotelRating = 5,
                        HotelUrl = "sitecore/content/hotel",
                        EcoFacility = "1",
                        NormalaziedName = "Hotel",
                        IsLatestVersion = true,
                        Language = "en",
                        Path = startPath
                    }
                });
                queryable.DefaultValues.Add(new HotelWithReviewSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = startPath
                });

                provider.GetQueryable<HotelWithReviewSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsWithReviews(startPath);

                    // Assert
                    result.Should().HaveCount(1);
                }
            }
        }

        [Theory]
        [InlineData("/sitecore/content/hotels/hotel1")]
        public void GetHotels_ShouldReturnHotels_IfHotelsExists(string path)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSyncSearchResultItem>(new HotelSyncSearchResultItem[]
                {
                    new HotelSyncSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = path,
                    }
                });
                queryable.DefaultValues.Add(new HotelSyncSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = path
                });

                provider.GetQueryable<HotelSyncSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotels(path);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                }
            }
        }

        [Theory]
        [AutoData]
        public void SearchHotelsByResortCodes_ShouldReturnData(string code1, string path1, string code2, string path2, string resortName, string resortCode)
        {
            // Arrange
            var resort1 = new DatasourceObject
            {
                ItemName = resortName,
                Name = resortName,
                Code = resortCode
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new[]
                {
                    new HotelSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = path1,
                        Code = code1,
                        HotelResort = JsonConvert.SerializeObject(resort1)
                    },
                    new HotelSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = path2,
                        Code = code2,
                        HotelResort = JsonConvert.SerializeObject(resort1)
                    }
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchHotelsByResortCodes(new[] { resortCode });

                    // Assert
                    logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
                    result.Should().HaveCount(2);
                }
            }
        }

        [Theory]
        [InlineData("/sitecore/content/hotels/hotel1")]
        public void GetAllHotels_ShouldReturnHotels_IfHotelsExists(string path)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSyncSearchResultItem>(new HotelSyncSearchResultItem[]
                {
                    new HotelSyncSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = path,
                    }
                });
                queryable.DefaultValues.Add(new HotelSyncSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = path
                });

                provider.GetQueryable<HotelSyncSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAllHotels(path);

                    // Assert
                    result.Should().HaveCount(1);
                }
            }
        }

        [Fact]
        public void SearchSyncHotelsByQuery_ShouldReturnHotels_IfHotelsExists()
        {
            // Arrange
            var language = Language.Parse("en");
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSyncSearchResultItem>(new HotelSyncSearchResultItem[]
                {
                    new HotelSyncSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = language.CultureInfo.Name,
                    }
                });
                queryable.DefaultValues.Add(new HotelSyncSearchResultItem
                {
                    Language = language.CultureInfo.Name,
                    IsLatestVersion = true,
                });

                provider.GetQueryable<HotelSyncSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchSyncHotelsByQuery(item => item.IsLatestVersion, language);

                    // Assert
                    result.Should().HaveCount(1);
                }
            }
        }

        [Theory]
        [AutoData]
        public void SearchSyncHotelsByQuery_ShouldReturnHotels_IfHotelsHasAtcomCode(string atcomCode)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var language = Language.Parse("en");
                var queryable = new SearchProviderQueryableCollection<HotelSyncSearchResultItem>(new HotelSyncSearchResultItem[]
                {
                    new HotelSyncSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = language.CultureInfo.Name,
                        SourceCodes = new[] { atcomCode }
                    }
                });
                queryable.DefaultValues.Add(new HotelSyncSearchResultItem
                {
                    Language = language.CultureInfo.Name,
                    IsLatestVersion = true,
                });

                provider.GetQueryable<HotelSyncSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchSyncHotelsByQuery(item => item.IsLatestVersion, language, new List<string>() { atcomCode });

                    // Assert
                    result.Should().HaveCount(1);
                }
            }
        }

        [Theory]
        [AutoData]
        public void SearchSyncHotelsByQuery_ShouldNotReturnHotels_IfHotelsDoNotHaveAtcomCode(List<string> atcomCodes)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSyncSearchResultItem>(new HotelSyncSearchResultItem[]
                {
                    new HotelSyncSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        IsLatestVersion = true,
                        Language = "en",
                        SourceCodes = new[] { "code" }
                    }
                });
                queryable.DefaultValues.Add(new HotelSyncSearchResultItem
                {
                    Language = "en",
                    IsLatestVersion = true,
                });

                provider.GetQueryable<HotelSyncSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    var language = Language.Parse("en");

                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchSyncHotelsByQuery(item => item.IsLatestVersion, language, atcomCodes);

                    // Assert
                    result.Should().HaveCount(0);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void SearchItinerary_ShouldSearchItinerary_IfItineraryExists(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<ItinerarySearchResultItem>(new ItinerarySearchResultItem[]
                {
                    new ItinerarySearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Resort,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new ItinerarySearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<ItinerarySearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchItinerary(new List<string> { code });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                }
            }
        }

        [Theory]
        [InlineData("code1")]
        public void GetDestinationsByAirportCodes_ShouldGetDestinationsByAirportCodes_IfDestinationsExists(string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<ItinerarySearchResultItem>(new ItinerarySearchResultItem[]
                {
                    new ItinerarySearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Resort,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new ItinerarySearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<ItinerarySearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).SearchItinerary(new List<string> { code });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Code.Should().Be(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByAirportCodesByAgrs_ShouldGetDestinationsByAirportCodes_IfDestinationsExists(DestinationByCodeQueryArgs args)
        {
            // Arrange
            args.Page = 1;
            args.Take = 1;
            args.ShouldGetItemsForAutocompleteOnly = true;
            args.ShouldGetItemsForDropdownOnly = true;

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new DestinationSearchResultItem[]
                {
                    new DestinationSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Resort,
                            ItemName = args.Query,
                            AirportCodes = args.Codes,
                            SortOrder = 100,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new DestinationSearchResultItem()
                {
                    Language = "en",
                    ShowInAutocomplete = args.ShouldGetItemsForAutocompleteOnly,
                    ShowOnDropdown = args.ShouldGetItemsForDropdownOnly,
                    ShowOnSearchPod = true,
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.ItemName.Should().Be(args.Query);
                    for (int i = 0; i < args.Codes.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.AirportCodes[i].Should().Be(args.Codes[i]);
                    }
                }
            }
        }

        [Fact]
        public void GetDestinationsByAirportCodes_ShouldRerunWithoutSorting_WhenBroadResultAndFirstHitInMaxSortBucket()
        {
            // Arrange
            var args = new DestinationByCodeQueryArgs
            {
                Codes = new[] { "ABC" },
                Take = 1,
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new[]
                {
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort0",
                        ItemName = "Resort0",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    },
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort1",
                        ItemName = "Resort1",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    }
                });

                queryable.DefaultValues.Add(new DestinationSearchResultItem
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.First().Document.Name.Should().Be("Resort0");
                }
            }
        }

        [Fact]
        public void GetDestinationsByAirportCodes_ShouldNotRerunWithoutSorting_WhenTakeIsZero()
        {
            // Arrange
            var args = new DestinationByCodeQueryArgs
            {
                Codes = new[] { "ABC" },
                Take = 0,
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new[]
                {
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort0",
                        ItemName = "Resort0",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    },
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort1",
                        ItemName = "Resort1",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    }
                });

                queryable.DefaultValues.Add(new DestinationSearchResultItem
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(2);
                    result.Hits.First().Document.Name.Should().Be("Resort0");
                }
            }
        }

        [Fact]
        public void GetDestinationsByAirportCodes_ShouldExecuteFallbackBranch_WhenShouldRerunWithoutSortingIsForcedTrue()
        {
            // Arrange
            var args = new DestinationByCodeQueryArgs
            {
                Codes = new[] { "ABC" },
                Take = 1,
            };

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new[]
                {
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort0",
                        ItemName = "Resort0",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    },
                    new DestinationSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Resort,
                        Name = "Resort1",
                        ItemName = "Resort1",
                        AirportCodes = new[] { "ABC" },
                        SortOrder = DestinationSortOrderComputedField.MaxSortOrder,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    }
                });

                queryable.DefaultValues.Add(new DestinationSearchResultItem
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    var sut = new TestableDestinationsRepository(settings, logger)
                    {
                        ForceRerunWithoutSorting = true
                    };

                    // Act
                    var result = sut.GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.First().Document.Name.Should().Be("Resort0");
                }
            }
        }

        [Theory]
        [InlineData(1, 2, DestinationSortOrderComputedField.MaxSortOrder, true, true)]
        [InlineData(0, 2, DestinationSortOrderComputedField.MaxSortOrder, true, false)]
        [InlineData(1, 1, DestinationSortOrderComputedField.MaxSortOrder, true, false)]
        [InlineData(1, 2, 3, true, false)]
        [InlineData(1, 2, 0, false, false)]
        public void ShouldRerunWithoutSortingInternal_ShouldCoverAllCases(
            int take,
            int totalSearchResults,
            int sortOrder,
            bool withHit,
            bool expected)
        {
            // Arrange
            SearchResults<DestinationSearchResultItem> results = withHit
                ? new SearchResults<DestinationSearchResultItem>(
                    new[]
                    {
                        new SearchHit<DestinationSearchResultItem>(1, new DestinationSearchResultItem
                        {
                            SortOrder = sortOrder
                        })
                    },
                    totalSearchResults)
                : new SearchResults<DestinationSearchResultItem>(
                    new List<SearchHit<DestinationSearchResultItem>>(),
                    totalSearchResults);

            bool actual;
            using (new ContentSearchSwitcher(index))
            {
                var probe = new DestinationsRepositoryProbe(settings, logger);
                // Act
                actual = probe.EvaluateShouldRerunWithoutSortingInternal(take, results);
            }

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void ShouldRerunWithoutSortingInternal_ShouldReturnFalse_WhenResultsIsNull()
        {
            // Arrange
            bool actual;
            using (new ContentSearchSwitcher(index))
            {
                var probe = new DestinationsRepositoryProbe(settings, logger);
                // Act
                actual = probe.EvaluateShouldRerunWithoutSortingInternal(1, null);
            }

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByAirportCodesByAgrs_ShouldBeDispayNameSearch_IfShouldBeCultureParamIsFalse(DestinationByCodeQueryArgs args)
        {
            // Arrange
            args.Page = 1;
            args.Take = 1;
            args.ShouldGetItemsForAutocompleteOnly = true;
            args.ShouldGetItemsForDropdownOnly = true;
            args.ShouldBeCultureSearch = false;
            args.Query = "Saelz";

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new DestinationSearchResultItem[]
                {
                    new DestinationSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Resort,
                            ItemName = "Sälz",
                            DisplayName = "Saelz",
                            AirportCodes = args.Codes,
                            SortOrder = 100,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new DestinationSearchResultItem()
                {
                    Language = "en",
                    ShowInAutocomplete = args.ShouldGetItemsForAutocompleteOnly,
                    ShowOnDropdown = args.ShouldGetItemsForDropdownOnly,
                    ShowOnSearchPod = true,
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.ItemName.Should().Be("Sälz");
                    result.Hits.FirstOrDefault().Document.DisplayName.Should().Be("Saelz");
                    for (int i = 0; i < args.Codes.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.AirportCodes[i].Should().Be(args.Codes[i]);
                    }
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByAirportCodesByAgrs_ShouldBeCultureSearch_IfShouldBeCultureParamIsTrue(DestinationByCodeQueryArgs args)
        {
            // Arrange
            args.Page = 1;
            args.Take = 1;
            args.ShouldGetItemsForAutocompleteOnly = true;
            args.ShouldGetItemsForDropdownOnly = true;
            args.ShouldBeCultureSearch = true;
            args.Query = "Sälz";

            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new DestinationSearchResultItem[]
                {
                    new DestinationSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Resort,
                            ItemName = "Sälz",
                            DisplayName = "Saelz",
                            AirportCodes = args.Codes,
                            SortOrder = 100,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new DestinationSearchResultItem()
                {
                    Language = "en",
                    ShowInAutocomplete = args.ShouldGetItemsForAutocompleteOnly,
                    ShowOnDropdown = args.ShouldGetItemsForDropdownOnly,
                    ShowOnSearchPod = true,
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                CultureInfo cultureInfo = new CultureInfo("en");
                provider.GetQueryable<DestinationSearchResultItem>(new CultureExecutionContext(cultureInfo)).Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByAirportCodes(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.ItemName.Should().Be("Sälz");
                    result.Hits.FirstOrDefault().Document.DisplayName.Should().Be("Saelz");
                    for (int i = 0; i < args.Codes.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.AirportCodes[i].Should().Be(args.Codes[i]);
                    }
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByHotelsParentPath_ShouldGetHotelsCoordinates_IfDestinationsExist(ID hotelsParentItemId, string name, string code, float longitude, float latitude)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            SourceCodes = new[] { code },
                            Paths = new ID[] { hotelsParentItemId },
                            Longitude = longitude,
                            Latitude = latitude,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true,
                    Longitude = longitude,
                    Latitude = latitude
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsCoordinatesByHotelsParentsPath(new ID[] { hotelsParentItemId });

                    // Assert
                    result.Hits.FirstOrDefault().Document.Longitude.Should().Be(longitude);
                    result.Hits.FirstOrDefault().Document.Latitude.Should().Be(latitude);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                    result.Hits.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsInsideCoordinateGrid_ShouldGetHotelsInsideCoordinateGrid_IfHotelInsideCoordinatesGrid(ID hotelsParentItemId, string name, string code, float longitude, float latitude)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            SourceCodes = new[] { code },
                            Paths = new ID[] { hotelsParentItemId },
                            Longitude = longitude,
                            Latitude = latitude,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true,
                    Longitude = longitude,
                    Latitude = latitude
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                var topLeftAngle = new Point()
                {
                    Latitude = 1,
                    Longitude = 1
                };

                var bottomRightAngle = new Point()
                {
                    Latitude = 2,
                    Longitude = 2
                };

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsInsideCoordinateGrid(topLeftAngle, bottomRightAngle);

                    // Assert
                    result.Hits.FirstOrDefault().Document.Longitude.Should().Be(longitude);
                    result.Hits.FirstOrDefault().Document.Latitude.Should().Be(latitude);
                    result.Hits.FirstOrDefault().Document.Name.Should().Be(name);
                    result.Hits.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsCodes_ShouldGetHotelsCodes_IfDataExist(string name, string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<SourcesSearchResultItem>(new[]
                {
                    new SourcesSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            SourceCodes = new[] { code },
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });

                queryable.DefaultValues.Add(new SourcesSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content"
                });

                provider.GetQueryable<SourcesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsCodes(1, 0, null);

                    // Assert
                    result.ElementAt(0).Should().Be(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsCodes_ShouldGetHotelsCodes_IfDataCorrect(string name1, string code1, string name2, string code2)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<SourcesSearchResultItem>(new[]
                {
                    new SourcesSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name1,
                        SourceCodes = new[] { code1 },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    },
                    new SourcesSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = "null",
                        SourceCodes = null,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    },
                    new SourcesSearchResultItem
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name2,
                        SourceCodes = new[] { code2 },
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content",
                    }
                });

                provider.GetQueryable<SourcesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsCodes(10, 0, null);

                    // Assert
                    result.Count().Should().Be(2);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetDestinationCodeByName_ShouldGetDestinationCodeByName_IfDestinationExist(string name, string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Country,
                            ItemName = name,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    ItemName = name,
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationCodeByName(name);

                    // Assert
                    result.Should().Be(code);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetAccommodationResortInfoByAccommodationCode_ShouldGetAccommodationResortInfoByAccommodationCode_IfDataExist(string name, string code, string resortImageUrl, string resortDescription)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelResortSearchResultItem>(new HotelResortSearchResultItem[]
                {
                    new HotelResortSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            SourceCodes = new[] { code },
                            ResortImageUrl = resortImageUrl,
                            ResortDescription = resortDescription,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new HotelResortSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<HotelResortSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetAccommodationResortInfoByAccommodationCode(code);

                    // Assert
                    result.ResortImageUrl.Should().Be(resortImageUrl);
                    result.ResortDescription.Should().Be(resortDescription);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetPromoFacilities_ShouldGetPromoFacilities_IfDataExist(string name, string code, string[] promoFacilities)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<PromoFacilitiesSearchResultItem>(new PromoFacilitiesSearchResultItem[]
                {
                    new PromoFacilitiesSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            SourceCodes = new[] { code },
                            PromoFacilities = promoFacilities,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new PromoFacilitiesSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<PromoFacilitiesSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetPromoFacilities(code);

                    // Assert
                    for (int i = 0; i < promoFacilities.Length; i++)
                    {
                        result.PromoFacilities[i].Should().Be(result.PromoFacilities[i]);
                    }
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByCodes_ShouldGetDestinationsByCodes_IfDataExist(string name, string code)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<DestinationSearchResultItem>(new DestinationSearchResultItem[]
                {
                    new DestinationSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Accommodation,
                            Name = name,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new DestinationSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<DestinationSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationsByCodes(new List<string> { code }, new List<string>());

                    // Assert
                    result.ElementAt(0).Document.Code.Should().Be(code);
                }
            }
        }

        [Theory(Skip = "After the sitecore migration the test has been broken. Need to be fixed.")]
        [AutoData]
        public void GetDestinationItemIdByCode_ShouldGetDestinationItemIdByCode_IfDataExist(string name, string code, ID itemId)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<BaseDatasourceSearchResultItem>(new BaseDatasourceSearchResultItem[]
                {
                    new BaseDatasourceSearchResultItem()
                        {
                            TemplateId = Constants.TemplateIds.Country,
                            ItemId = itemId,
                            Name = name,
                            Code = code,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = "/sitecore/content",
                        }
                });
                queryable.DefaultValues.Add(new BaseDatasourceSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true
                });

                provider.GetQueryable<BaseDatasourceSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetDestinationItemByCode(code);

                    // Assert
                    result.ItemId.Should().Be(itemId);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByHotelsParents_ShouldGetHotelsCoordinates_IfDestinationsExist(string name, string code, float longitude, float latitude)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var ids = new ID[2] { ID.NewID, ID.NewID };
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ids[0] },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ids[1] },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.AccommodationBoard,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true,
                    Longitude = longitude,
                    Latitude = latitude
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsCoordinatesByHotelsParentsPath(ids);

                    // Assert
                    result.Hits.Count().Should().Be(2);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByHotelsParents_ShouldReturnEmpty_IfDestinationsNotExist(string name, string code, float longitude, float latitude)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var ids = new ID[] { ID.NewID };
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                    new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.AccommodationBoard,
                        Name = name,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Longitude = longitude,
                        Latitude = latitude,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    },
                });
                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true,
                    Longitude = longitude,
                    Latitude = latitude
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelsCoordinatesByHotelsParentsPath(ids);

                    // Assert
                    result.Hits.Count().Should().Be(0);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelHighlightsByAccommodationCode_ShouldGetHotelHighlightsByAccommodationCode_IfDataExist(string code, string title, string subtitle, string description, string image)
        {
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var highlightsJson = JsonConvert.SerializeObject(new[]
                {
                    new HotelHighlights
                    {
                        Title = title,
                        Description = description,
                        Subtitle = subtitle,
                        Image = image
                    }
                });
                var queryable = new SearchProviderQueryableCollection<HotelHighlightsSearchResultItem>(new HotelHighlightsSearchResultItem[]
                {
                    new HotelHighlightsSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Name = title,
                        Language = "en",
                        Path = "/sitecore/content",
                        IsLatestVersion = true,
                        SourceCodes = new[] { code },
                        HotelHighlights = highlightsJson
                    }
                });
                queryable.DefaultValues.Add(new HotelHighlightsSearchResultItem()
                {
                    Language = "en",
                    Path = "/sitecore/content",
                    IsLatestVersion = true,
                });

                provider.GetQueryable<HotelHighlightsSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsRepository(settings, logger).GetHotelHighlightsByAccommodationCode(code);

                    // Assert
                    result.HotelHighlights.Should().Be(highlightsJson);
                }
            }
        }

        private FakeSiteContext GetFakeSiteContext()
        {
            return new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });
        }

        private class TestableDestinationsRepository : DestinationsRepository
        {
            public TestableDestinationsRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger destinationsLogger)
                : base(indexSettings, destinationsLogger)
            {
            }

            public bool ForceRerunWithoutSorting { get; set; }

            protected internal override bool ShouldRerunWithoutSortingInternal(int take, SearchResults<DestinationSearchResultItem> results)
                => ForceRerunWithoutSorting;
        }

        private class DestinationsRepositoryProbe : DestinationsRepository
        {
            public DestinationsRepositoryProbe(IDestinationSearchSettings indexSettings, IDestinationsLogger destinationsLogger)
                : base(indexSettings, destinationsLogger)
            {
            }

            public bool EvaluateShouldRerunWithoutSortingInternal(int take, SearchResults<DestinationSearchResultItem> results)
                => ShouldRerunWithoutSortingInternal(take, results);
        }
    }
}
