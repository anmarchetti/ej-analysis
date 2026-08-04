using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class FacilityMatrixServiceTests
    {
        private readonly IFacilityMatrixService facilityMatrix;
        private readonly ISitecoreContext sitecoreContext;
        private readonly IHtmlCacheRepository htmlCacheRepository;

        public FacilityMatrixServiceTests()
        {
            sitecoreContext = Substitute.For<ISitecoreContext>();
            htmlCacheRepository = Substitute.For<IHtmlCacheRepository>();
            facilityMatrix = new FacilityMatrixService(sitecoreContext, htmlCacheRepository);
        }

        [Fact]
        public void GetFacilityMatrix_FromItem_Success()
        {
            const string itemPath = "/sitecore/facilityMatrix/conf";
            var facilityMatrixValueChild1 = GetFacilityMatrixValue("1", "1");
            var facilityMatrixValueChild2 = GetFacilityMatrixValue("1", "0");
            var facilityMatrixAdu = GetFacilityMatrixConfiguration("adu").WithChild(facilityMatrixValueChild1);
            var facilityMatrixFam = GetFacilityMatrixConfiguration("fam").WithChild(facilityMatrixValueChild2);

            facilityMatrixAdu.ToSitecoreItem().Versions.Count.Returns(1);
            facilityMatrixFam.ToSitecoreItem().Versions.Count.Returns(1);

            var facMatrixFolder = new FakeItem()
                .WithChild(facilityMatrixFam)
                .WithChild(facilityMatrixAdu)
                .WithPath(itemPath).ToSitecoreItem();

            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns((List<FacilityMatrixConfiguration>)null);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);
            sitecoreContext.Database.Returns(facMatrixFolder.Database);
            sitecoreContext.Database.GetItem(Arg.Any<string>(), Arg.Any<Language>()).Returns(facMatrixFolder);

            using (new SettingsSwitcher("ContentSearch.FacilityMatrix.Configuration", itemPath))
            {
                var res = facilityMatrix.GetFacilityMatrix();

                res.Should().NotBeNull();
                res.Count.Should().Be(2);
                res[0].Code.Should().BeEquivalentTo("fam");
                res[0].TrackingId.Should().BeEquivalentTo("name-fam");
                res[1].Code.Should().BeEquivalentTo("adu");
                res[1].TrackingId.Should().BeEquivalentTo("name-adu");
            }
        }

        [Fact]
        public void GetFacilityMatrix_NoItem_EmptyMatrix()
        {
            var db = new FakeItem().ToSitecoreItem().Database;
            const string itemPath = "/sitecore/facilityMatrix/conf";

            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns((List<FacilityMatrixConfiguration>)null);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);
            sitecoreContext.Database.Returns(db);
            sitecoreContext.Database.GetItem(Arg.Any<string>(), Arg.Any<Language>()).Returns((Item)null);

            using (new SettingsSwitcher("ContentSearch.FacilityMatrix.Configuration", itemPath))
            {
                var res = facilityMatrix.GetFacilityMatrix();

                res.Should().NotBeNull();
                res.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetFacilityMatrix_FromCache_Success()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration> { new FacilityMatrixConfiguration { Code = "adu" } };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var res = facilityMatrix.GetFacilityMatrix();

            res.Should().NotBeNull();
            res.Should().ContainSingle();
            res[0].Code.Should().BeEquivalentTo(resultMatrix[0].Code);
        }

        [Fact]
        public void EnrichFacilityMatrix_EmptyHotelFacilities_NoAction()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration> { new FacilityMatrixConfiguration { Code = "adu", Id = ID.NewID } };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<Hotel>() { new Hotel() };
            facilityMatrix.EnrichHotelFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels[0].FacilityMatrix.Should().BeNull();
        }

        [Fact]
        public void EnrichFacilityMatrix_EmptyMatrix_NoAction()
        {
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns((List<FacilityMatrixConfiguration>)null);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<Hotel>() { new Hotel() };
            facilityMatrix.EnrichHotelFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels[0].FacilityMatrix.Should().BeNull();
        }

        [Fact]
        public void EnrichFacilityMatrix_MustHaveTrue_Success()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration>
            {
                new FacilityMatrixConfiguration
                {
                    Id = ID.NewID, Code = "adu", Values = new List<FacilityMatrixConfigurationValue>
                    {
                        new FacilityMatrixConfigurationValue() { Code = "1", MustHave = true, Value = 1 },
                        new FacilityMatrixConfigurationValue() { Code = "2", MustHave = true, Value = 2 },
                        new FacilityMatrixConfigurationValue() { Code = "3", MustHave = true, Value = 3 },
                        new FacilityMatrixConfigurationValue() { Code = "4", MustHave = false, Value = 4 },
                        new FacilityMatrixConfigurationValue() { Code = "5", MustHave = true, Value = 5 },
                    }
                }
            };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<Hotel>()
            {
                new Hotel
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "1",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "2",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "3",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "6",
                                }
                            }
                        },
                    },
                    FacilitiesFiltered = new List<FacilityFilteredType>()
                    {
                        new FacilityFilteredType()
                        {
                            Code = "2",
                        },
                        new FacilityFilteredType()
                        {
                            Code = "4",
                        },
                        new FacilityFilteredType()
                        {
                            Code = "5",
                        },
                    }
                },
                new Hotel
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test2",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "6",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "7",
                                }
                            }
                        },
                    }
                }
            };

            facilityMatrix.EnrichHotelFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels.Count.Should().Be(2);
            hotels[0].FacilityMatrix.Should().NotBeNull();
            hotels[0].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[0].FacilityMatrix[0].Value.Should().Be(15);
            hotels[1].FacilityMatrix.Should().BeEmpty();
        }

        [Fact]
        public void EnrichFacilityMatrix_Success()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration>
            {
                new FacilityMatrixConfiguration
                {
                    Id = ID.NewID, Code = "adu", Values = new List<FacilityMatrixConfigurationValue>
                    {
                        new FacilityMatrixConfigurationValue() { Code = "1", MustHave = false, Value = 1 },
                        new FacilityMatrixConfigurationValue() { Code = "2", MustHave = false, Value = 2 },
                        new FacilityMatrixConfigurationValue() { Code = "3", MustHave = false, Value = 3 },
                        new FacilityMatrixConfigurationValue() { Code = "4", MustHave = false, Value = 4 },
                    }
                }
            };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<Hotel>()
            {
                new Hotel
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "1",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "3",
                                }
                            }
                        },
                    }
                },
                new Hotel
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test2",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "2",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "4",
                                }
                            }
                        },
                    }
                }
            };

            facilityMatrix.EnrichHotelFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels.Count.Should().Be(2);
            hotels[0].FacilityMatrix.Should().NotBeNull();
            hotels[0].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[0].FacilityMatrix[0].Value.Should().Be(4);
            hotels[1].FacilityMatrix.Should().NotBeNull();
            hotels[1].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[1].FacilityMatrix[0].Value.Should().Be(6);
        }

        [Fact]
        public void EnrichFacilityMatrix_FacilitiesOverriden_Success()
        {
            var testId1 = ID.NewID;
            var testId2 = ID.NewID;

            var resultMatrix = new List<FacilityMatrixConfiguration>
            {
                new FacilityMatrixConfiguration
                {
                    Code = "adu", Id = testId1,
                },
                new FacilityMatrixConfiguration
                {
                    Code = "fam", Id = testId2,
                }
            };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<Hotel>()
            {
                new Hotel
                {
                    IsMatrixOverriden = true,
                    MatrixOverride = new[] { testId1.ToShortID().ToString().ToLowerInvariant(), testId2.ToShortID().ToString().ToLowerInvariant() },
                },
                new Hotel
                {
                    IsMatrixOverriden = true,
                    MatrixOverride = new[] { testId1.ToShortID().ToString().ToLowerInvariant() },
                }
            };
            facilityMatrix.EnrichHotelFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels.Count.Should().Be(2);
            hotels[0].FacilityMatrix.Should().NotBeNull();
            hotels[0].FacilityMatrix.Length.Should().Be(2);
            hotels[0].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[0].FacilityMatrix[0].Value.Should().Be(99);
            hotels[0].FacilityMatrix[1].Code.Should().Be(resultMatrix[1].Code);
            hotels[0].FacilityMatrix[1].Value.Should().Be(98);
            hotels[1].FacilityMatrix.Should().NotBeNull();
            hotels[1].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[1].FacilityMatrix[0].Value.Should().Be(99);
        }

        [Fact]
        public void EnrichFacilityMatrix_EmptyHotelFilterFacilities_NoAction()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration> { new FacilityMatrixConfiguration { Code = "adu", Id = ID.NewID } };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotelfitlers = new List<HotelFilters>() { new HotelFilters() };
            facilityMatrix.EnrichHotelFiltersFacilityMatrix(hotelfitlers);

            hotelfitlers.Should().NotBeEmpty();
            hotelfitlers[0].FacilityMatrix.Should().BeNull();
        }

        [Fact]
        public void EnrichFacilityMatrixFacilityFilters_EmptyMatrix_NoAction()
        {
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns((List<FacilityMatrixConfiguration>)null);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<HotelFilters>() { new HotelFilters() };
            facilityMatrix.EnrichHotelFiltersFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels[0].FacilityMatrix.Should().BeNull();
        }

        [Fact]
        public void EnrichFacilityMatrix_FacilityFilters_Success()
        {
            var resultMatrix = new List<FacilityMatrixConfiguration>
            {
                new FacilityMatrixConfiguration
                {
                    Id = ID.NewID, Code = "adu", Values = new List<FacilityMatrixConfigurationValue>
                    {
                        new FacilityMatrixConfigurationValue() { Code = "1", MustHave = false, Value = 1 },
                        new FacilityMatrixConfigurationValue() { Code = "2", MustHave = false, Value = 2 },
                        new FacilityMatrixConfigurationValue() { Code = "3", MustHave = false, Value = 3 },
                        new FacilityMatrixConfigurationValue() { Code = "4", MustHave = false, Value = 4 },
                    }
                }
            };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<HotelFilters>()
            {
                new HotelFilters
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "1",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "3",
                                }
                            }
                        },
                    }
                },
                new HotelFilters
                {
                    Facilities = new List<AccommodationFacilityVirtualGroup>
                    {
                        new AccommodationFacilityVirtualGroup
                        {
                            Code = "test2",
                            Items = new List<HotelFacility>()
                            {
                                new HotelFacility()
                                {
                                    FacilityCode = "2",
                                },
                                new HotelFacility()
                                {
                                    FacilityCode = "4",
                                }
                            }
                        },
                    }
                }
            };
            facilityMatrix.EnrichHotelFiltersFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels.Count.Should().Be(2);
            hotels[0].FacilityMatrix.Should().NotBeNull();
            hotels[0].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[0].FacilityMatrix[0].Value.Should().Be(4);
            hotels[1].FacilityMatrix.Should().NotBeNull();
            hotels[1].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[1].FacilityMatrix[0].Value.Should().Be(6);
        }

        [Fact]
        public void EnrichFacilityMatrixFilters_FacilitiesOverriden_Success()
        {
            var testId1 = ID.NewID;
            var testId2 = ID.NewID;

            var resultMatrix = new List<FacilityMatrixConfiguration>
            {
                new FacilityMatrixConfiguration
                {
                    Code = "adu", Id = testId1,
                },
                new FacilityMatrixConfiguration
                {
                    Code = "fam", Id = testId2,
                }
            };
            htmlCacheRepository.GetItem<List<FacilityMatrixConfiguration>>(Arg.Any<string>()).Returns(resultMatrix);
            var lang = Substitute.For<Language>(Array.Empty<object>());
            sitecoreContext.Language.Returns(lang);

            var hotels = new List<HotelFilters>()
            {
                new HotelFilters
                {
                    IsMatrixOverriden = true,
                    MatrixOverride = new[] { testId1.ToShortID().ToString().ToLowerInvariant(), testId2.ToShortID().ToString().ToLowerInvariant() },
                },
                new HotelFilters
                {
                    IsMatrixOverriden = true,
                    MatrixOverride = new[] { testId1.ToShortID().ToString().ToLowerInvariant() },
                }
            };
            facilityMatrix.EnrichHotelFiltersFacilityMatrix(hotels);

            hotels.Should().NotBeEmpty();
            hotels.Count.Should().Be(2);
            hotels[0].FacilityMatrix.Should().NotBeNull();
            hotels[0].FacilityMatrix.Length.Should().Be(2);
            hotels[0].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[0].FacilityMatrix[0].Value.Should().Be(99);
            hotels[0].FacilityMatrix[1].Code.Should().Be(resultMatrix[1].Code);
            hotels[0].FacilityMatrix[1].Value.Should().Be(98);
            hotels[1].FacilityMatrix.Should().NotBeNull();
            hotels[1].FacilityMatrix[0].Code.Should().Be(resultMatrix[0].Code);
            hotels[1].FacilityMatrix[0].Value.Should().Be(99);
        }

        private static FakeItem GetFacilityMatrixConfiguration(string code)
            => new FakeItem()
             .WithName($"tracking-{code}")
             .WithField(Constants.Fields.DatasourceItem.Code, code)
             .WithField(Constants.Fields.DatasourceItem.Name, $"name-{code}")
             .WithField(Constants.Fields.FacilityMatrixItem.TypeTitle, $"title-{code}")
             .WithField(Constants.Fields.DatasourceItem.Description, $"desc-{code}")
             .WithField(Constants.Fields.SitecoreIconItem.Icon, null)
             .WithField(Constants.Fields.FacilityMatrixItem.FilledIcon, null)
             .WithField(Constants.Fields.FacilityMatrixItem.TooltipText, $"tooltip-{code}")
             .WithField(Constants.Fields.FacilityMatrixItem.IsExclusive, "1")
             .WithItemVersions();

        private static FakeItem GetFacilityMatrixValue(string value, string mustHave)
            => new FakeItem()
                .WithField(Constants.Fields.SitecoreProperty.Value, value)
                .WithField(Constants.Fields.FacilityMatrixConfiguration.MustHaveCheckbox, mustHave)
                .WithField(Constants.Fields.FacilityMatrixConfiguration.Facilities, string.Empty)
                .WithItemVersions();
    }
}
