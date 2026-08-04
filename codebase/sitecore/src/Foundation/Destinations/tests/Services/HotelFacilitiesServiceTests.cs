using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelFacilitiesServiceTests
    {
        private static readonly ID FacilityTypesGroupTemplateId = new ID("{7E1CEEB8-9A59-4584-91E8-6014A5B0FF56}");

        private readonly IDestinationsRepository repository;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;
        private readonly IDestinationsLogger logger;
        private readonly BaseSettings settings;
        private readonly HotelFacilitiesService service;

        public HotelFacilitiesServiceTests()
        {
            repository = Substitute.For<IDestinationsRepository>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            searchDatasourceRepository = Substitute.For<ISearchDatasourceRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            settings = Substitute.For<BaseSettings>();

            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(500);

            service = new HotelFacilitiesService(
                settings,
                repository,
                datasourceRepository,
                searchDatasourceRepository,
                logger);
        }

        [Fact]
        public void GetHotelsFacilitiesAsync()
        {
            // Arrange
            int totalNumberOfCodes = 1500;
            int subsetSize = 500;

            repository.SearchHotelsFacilitiesByIds(Arg.Any<List<string>>())
                .Returns(
                    GetSearches(subsetSize),
                    GetSearches(subsetSize * 2, subsetSize),
                    GetSearches(subsetSize * 3, subsetSize * 2));

            // Act
            var actual = service.GetHotelsFacilities(GetCodes(totalNumberOfCodes).ToArray());

            // Assert
            actual.Count.Should().Be(totalNumberOfCodes);
        }

        [Fact]
        public void Create_ShouldThrowArgumentNullException_WhenParentItemIsNull()
        {
            // Act
            Action act = () => service.Create(
                null,
                new List<FacilityContent>(),
                Constants.TemplateIds.AccommodationFacilitiesFolder,
                Constants.TemplateIds.AccommodationFacility);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Upsert_ShouldThrowArgumentNullException_WhenParentItemIsNull()
        {
            // Act
            Action act = () => service.Upsert(
                null,
                new List<FacilityContent>(),
                Constants.TemplateIds.AccommodationFacilitiesFolder,
                Constants.TemplateIds.AccommodationFacility);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Create_ShouldSkip_WhenFacilitiesAreNull()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.Create(
                    hotelItem,
                    null,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetAllItemsByCodes(default(List<string>), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No facilities found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldSkip_WhenFacilitiesAreEmpty()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.Create(
                    hotelItem,
                    new List<FacilityContent>(),
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetAllItemsByCodes(default(List<string>), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No facilities found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Upsert_ShouldSkip_WhenFacilitiesAreEmpty()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                // Act
                service.Upsert(
                    hotelItem,
                    new List<FacilityContent>(),
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetAllItemsByCodes(default(List<string>), default(ID));

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("No facilities found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldCreateFacility_WhenFacilityTypeIsFoundBySearch()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Bar", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "130" },
                    { Constants.Fields.DatasourceItem.Name, "Bar" }
                },
                new DbItem("Created Bar", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Bar");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Bar");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = "Hotel-level Bar facility"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("130")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        facilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                searchDatasourceRepository.Received(1).GetAllItemsByCodes(
                    Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("130")),
                    Constants.TemplateIds.FacilityType);

                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetItemByCode(default(string), default(ID), default(bool));

                datasourceRepository.Received(1).GetOrCreateFolderItem(
                    hotelItem,
                    Constants.Fields.AccommodationItem.Facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder);

                datasourceRepository.Received(1).GetOrCreateItem(
                    facilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                createdFacilityItem[Constants.Fields.BaseFacilityItem.FacilityType].Should().Be(facilityType.ID.ToString());
                createdFacilityItem[Constants.Fields.BaseFacilityItem.Name].Should().Be("Bar");
                createdFacilityItem[Constants.Fields.AccommodationFacilityItem.TextValue].Should().Be("Hotel-level Bar facility");
            }
        }

        [Fact]
        public void Create_ShouldResolveFacilityTypesOnce_WhenMultipleFacilitiesAreProvided()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Bar", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "130" },
                    { Constants.Fields.DatasourceItem.Name, "Bar" }
                },
                new DbItem("Smoking area", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "225" },
                    { Constants.Fields.DatasourceItem.Name, "Smoking area" }
                },
                new DbItem("Created Bar", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                },
                new DbItem("Created Smoking area", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var barFacilityType = db.GetItem("/sitecore/content/Bar");
                var smokingAreaFacilityType = db.GetItem("/sitecore/content/Smoking area");
                var createdBar = db.GetItem("/sitecore/content/Created Bar");
                var createdSmokingArea = db.GetItem("/sitecore/content/Created Smoking area");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = "Bar value"
                    },
                    new FacilityContent
                    {
                        Code = "225",
                        Name = "Smoking area",
                        Value = "Smoking area value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 2 && x.Contains("130") && x.Contains("225")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { barFacilityType, smokingAreaFacilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        barFacilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdBar);

                datasourceRepository
                    .CreateItem(
                        smokingAreaFacilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdSmokingArea);

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                searchDatasourceRepository.Received(1).GetAllItemsByCodes(
                    Arg.Is<List<string>>(x => x.Count == 2 && x.Contains("130") && x.Contains("225")),
                    Constants.TemplateIds.FacilityType);

                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetItemByCode(default(string), default(ID), default(bool));

                datasourceRepository.Received(1).GetOrCreateItem(
                    barFacilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                datasourceRepository.Received(1).GetOrCreateItem(
                    smokingAreaFacilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);
            }
        }

        [Fact]
        public void Create_ShouldSkip_WhenFacilityCodeIsMissing()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = " ",
                        Name = "Missing Code",
                        Value = "Missing code value"
                    }
                };

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetAllItemsByCodes(default(List<string>), default(ID));

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("No matching facility types found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldSkipFacility_WhenFacilityTypeIsNotFound()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "999",
                        Name = "Unknown Facility",
                        Value = "Unknown value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("999")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(Enumerable.Empty<Sitecore.Data.Items.Item>());

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                searchDatasourceRepository.Received(1).GetAllItemsByCodes(
                    Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("999")),
                    Constants.TemplateIds.FacilityType);

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .GetOrCreateFolderItem(default(Sitecore.Data.Items.Item), default(string), default(ID));

                datasourceRepository.DidNotReceiveWithAnyArgs()
                    .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item), default(bool));

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("No matching facility types found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldSkipOnlyUnknownFacility_WhenSomeFacilityTypesAreFound()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Bar", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "130" },
                    { Constants.Fields.DatasourceItem.Name, "Bar" }
                },
                new DbItem("Created Bar", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Bar");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Bar");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = "Bar value"
                    },
                    new FacilityContent
                    {
                        Code = "999",
                        Name = "Unknown Facility",
                        Value = "Unknown value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 2 && x.Contains("130") && x.Contains("999")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        facilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(
                    facilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("Facility type '999' not found")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Create_ShouldSkipDuplicate_WhenMultipleFacilitiesShareSameCode()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Wheelchair accessible path of travel", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "47" },
                    { Constants.Fields.DatasourceItem.Name, "Wheelchair accessible path of travel" }
                },
                new DbItem("Created Wheelchair", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Wheelchair accessible path of travel");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Wheelchair");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "47",
                        Name = "Wheelchair accessible path of travel",
                        Value = "true"
                    },
                    new FacilityContent
                    {
                        Code = "47",
                        Name = "Wheelchair accessible path of travel",
                        Value = "also true"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("47")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .CreateItem(
                        facilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert — CreateItem called only once; second duplicate is skipped
                datasourceRepository.Received(1).GetOrCreateItem(
                    facilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);
            }
        }

        [Fact]
        public void Create_ShouldSkipExistingFacility_WhenFacilitiesFolderAlreadyContainsItem()
        {
            var facilityTypeId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                    {
                        new DbItem("Wheelchair accessible path of travel", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                        {
                            { Constants.Fields.BaseFacilityItem.FacilityType, facilityTypeId.ToString() },
                            { Constants.Fields.BaseFacilityItem.Name, "Wheelchair accessible path of travel" },
                            { Constants.Fields.AccommodationFacilityItem.TextValue, "true" }
                        }
                    }
                },
                new DbItem("Facility Type Wheelchair", facilityTypeId, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "47" },
                    { Constants.Fields.DatasourceItem.Name, "Wheelchair accessible path of travel" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Facility Type Wheelchair");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "47",
                        Name = "Wheelchair accessible path of travel",
                        Value = "true"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("47")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                // Act
                service.Create(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert — existing item detected; CreateItem never called
                datasourceRepository.DidNotReceive().CreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);
            }
        }

        [Fact]
        public void Upsert_ShouldUpdateExistingFacility_WhenFacilityAlreadyExists()
        {
            var facilityTypeId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                    {
                        new DbItem("Bar", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                        {
                            { Constants.Fields.BaseFacilityItem.FacilityType, facilityTypeId.ToString() },
                            { Constants.Fields.AccommodationFacilityItem.TextValue, "Old value" }
                        }
                    }
                },
                new DbItem("Facility Type Bar", facilityTypeId, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "130" },
                    { Constants.Fields.DatasourceItem.Name, "Bar" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Facility Type Bar");
                var existingFacilityItem = db.GetItem("/sitecore/content/Hotel/Facilities/Bar");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = "Updated value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("130")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                // Act
                service.Upsert(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.DidNotReceive().CreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("Updated facility value")),
                    Arg.Any<object>());

                existingFacilityItem.Should().NotBeNull();
                existingFacilityItem.Versions.GetLatestVersion()[Constants.Fields.AccommodationFacilityItem.TextValue]
                    .Should().Be("Updated value");
            }
        }

        [Fact]
        public void Upsert_ShouldSkipExistingFacilityUpdate_WhenFacilityValueIsEmpty()
        {
            var facilityTypeId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                    {
                        new DbItem("Bar", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                        {
                            { Constants.Fields.BaseFacilityItem.FacilityType, facilityTypeId.ToString() },
                            { Constants.Fields.AccommodationFacilityItem.TextValue, "Old value" }
                        }
                    }
                },
                new DbItem("Facility Type Bar", facilityTypeId, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "130" },
                    { Constants.Fields.DatasourceItem.Name, "Bar" }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Facility Type Bar");
                var existingFacilityItem = db.GetItem("/sitecore/content/Hotel/Facilities/Bar");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "130",
                        Name = "Bar",
                        Value = " "
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("130")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                // Act
                service.Upsert(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.DidNotReceive().CreateItem(
                    Arg.Any<string>(),
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                existingFacilityItem[Constants.Fields.AccommodationFacilityItem.TextValue].Should().Be("Old value");

                logger.Received(1).Info(
                    Arg.Is<string>(x => x.Contains("Facility value is null")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void Upsert_ShouldCreateFacility_WhenFacilityDoesNotAlreadyExist()
        {
            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Facility Type Desk", ID.NewID, Constants.TemplateIds.FacilityType)
                {
                    { Constants.Fields.DatasourceItem.Code, "279" },
                    { Constants.Fields.DatasourceItem.Name, "Desk" }
                },
                new DbItem("Created Desk", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var facilityType = db.GetItem("/sitecore/content/Facility Type Desk");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Desk");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "279",
                        Name = "Desk",
                        Value = "Desk value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("279")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { facilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        facilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Upsert(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(
                    facilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                var latestCreatedFacilityItem = createdFacilityItem.Versions.GetLatestVersion();

                latestCreatedFacilityItem[Constants.Fields.BaseFacilityItem.FacilityType].Should().Be(facilityType.ID.ToString());
                latestCreatedFacilityItem[Constants.Fields.BaseFacilityItem.Name].Should().Be("Desk");
                latestCreatedFacilityItem[Constants.Fields.AccommodationFacilityItem.TextValue].Should().Be("Desk value");
            }
        }

        [Fact]
        public void Upsert_ShouldPreferExpediaPropertyFacilityType_WhenAccommodationFacilityIsCreated()
        {
            var standardTypeId = ID.NewID;
            var expediaPropertyTypeId = ID.NewID;
            var expediaRoomTypeId = ID.NewID;

            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
        },
        new DbItem("Standard Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "30" },
            { Constants.Fields.DatasourceItem.Name, "Standard Facilities" },
            new DbItem("American Express Type", standardTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "1" },
                { Constants.Fields.DatasourceItem.Name, "American Express" }
            }
        },
        new DbItem("Expedia Property Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "EXP-P-1" },
            { Constants.Fields.DatasourceItem.Name, "Expedia Property Facilities" },
            new DbItem("Air conditioning Property Type", expediaPropertyTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "1" },
                { Constants.Fields.DatasourceItem.Name, "Air conditioning" }
            }
        },
        new DbItem("Expedia Room Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "EXP-R-1" },
            { Constants.Fields.DatasourceItem.Name, "Expedia Room Facilities" },
            new DbItem("Air conditioning Room Type", expediaRoomTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "1" },
                { Constants.Fields.DatasourceItem.Name, "Air conditioning room" }
            }
        },
        new DbItem("Created Air conditioning", ID.NewID, Constants.TemplateIds.AccommodationFacility)
        {
            { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
            { Constants.Fields.BaseFacilityItem.Name, string.Empty },
            { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");

                var standardFacilityType = db.GetItem("/sitecore/content/Standard Facilities/American Express Type");
                var expediaPropertyFacilityType = db.GetItem("/sitecore/content/Expedia Property Facilities/Air conditioning Property Type");
                var expediaRoomFacilityType = db.GetItem("/sitecore/content/Expedia Room Facilities/Air conditioning Room Type");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Air conditioning");

                var facilities = new List<FacilityContent>
        {
            new FacilityContent
            {
                Code = "1",
                Name = "Air conditioning",
                Value = "AC value"
            }
        };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("1")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { standardFacilityType, expediaRoomFacilityType, expediaPropertyFacilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        expediaPropertyFacilityType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Upsert(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(
                    expediaPropertyFacilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    standardFacilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    expediaRoomFacilityType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                var latestCreatedFacilityItem = createdFacilityItem.Versions.GetLatestVersion();

                latestCreatedFacilityItem[Constants.Fields.BaseFacilityItem.FacilityType]
                    .Should().Be(expediaPropertyFacilityType.ID.ToString());

                latestCreatedFacilityItem[Constants.Fields.AccommodationFacilityItem.TextValue]
                    .Should().Be("AC value");
            }
        }

        [Fact]
        public void Upsert_ShouldUseFirstFacilityType_WhenDuplicateCodeExistsWithoutExpediaGroup()
        {
            var firstTypeId = ID.NewID;
            var secondTypeId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
                },
                new DbItem("Business Facilities", ID.NewID, FacilityTypesGroupTemplateId)
                {
                    { Constants.Fields.DatasourceItem.Code, "30" },
                    { Constants.Fields.DatasourceItem.Name, "Business Facilities" },
                    new DbItem("First Type", firstTypeId, Constants.TemplateIds.FacilityType)
                    {
                        { Constants.Fields.DatasourceItem.Code, "72" },
                        { Constants.Fields.DatasourceItem.Name, "First Type" }
                    }
                },
                new DbItem("Other Facilities", ID.NewID, FacilityTypesGroupTemplateId)
                {
                    { Constants.Fields.DatasourceItem.Code, "70" },
                    { Constants.Fields.DatasourceItem.Name, "Other Facilities" },
                    new DbItem("Second Type", secondTypeId, Constants.TemplateIds.FacilityType)
                    {
                        { Constants.Fields.DatasourceItem.Code, "72" },
                        { Constants.Fields.DatasourceItem.Name, "Second Type" }
                    }
                },
                new DbItem("Created Facility", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
                    { Constants.Fields.BaseFacilityItem.Name, string.Empty },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
                }
            })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");
                var facilitiesFolder = db.GetItem("/sitecore/content/Hotel/Facilities");
                var firstType = db.GetItem("/sitecore/content/Business Facilities/First Type");
                var secondType = db.GetItem("/sitecore/content/Other Facilities/Second Type");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Facility");

                var facilities = new List<FacilityContent>
                {
                    new FacilityContent
                    {
                        Code = "72",
                        Name = "Whatever name",
                        Value = "Some value"
                    }
                };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("72")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { firstType, secondType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        hotelItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.AccommodationFacilitiesFolder)
                    .Returns(facilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        firstType.Name,
                        Constants.TemplateIds.AccommodationFacility,
                        facilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Upsert(
                    hotelItem,
                    facilities,
                    Constants.TemplateIds.AccommodationFacilitiesFolder,
                    Constants.TemplateIds.AccommodationFacility);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(
                    firstType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    secondType.Name,
                    Constants.TemplateIds.AccommodationFacility,
                    facilitiesFolder,
                    true);

                var latestCreatedFacilityItem = createdFacilityItem.Versions.GetLatestVersion();

                latestCreatedFacilityItem[Constants.Fields.BaseFacilityItem.FacilityType]
                    .Should().Be(firstType.ID.ToString());
            }
        }

        [Fact]
        public void Upsert_ShouldPreferExpediaRoomFacilityType_WhenRoomFacilityIsCreated()
        {
            var standardTypeId = ID.NewID;
            var expediaPropertyTypeId = ID.NewID;
            var expediaRoomTypeId = ID.NewID;

            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, "W123456" },
                new DbItem("Room 1", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    new DbItem(Constants.Fields.AccommodationItem.Facilities, ID.NewID, Constants.TemplateIds.RoomFacilitiesFolder)
                }
            }
        },
        new DbItem("Standard Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "30" },
            { Constants.Fields.DatasourceItem.Name, "Standard Facilities" },
            new DbItem("Standard Type", standardTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "100" },
                { Constants.Fields.DatasourceItem.Name, "Standard internet" }
            }
        },
        new DbItem("Expedia Property Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "EXP-P-1" },
            { Constants.Fields.DatasourceItem.Name, "Expedia Property Facilities" },
            new DbItem("Property Internet Type", expediaPropertyTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "100" },
                { Constants.Fields.DatasourceItem.Name, "Property internet" }
            }
        },
        new DbItem("Expedia Room Facilities", ID.NewID, FacilityTypesGroupTemplateId)
        {
            { Constants.Fields.DatasourceItem.Code, "EXP-R-1" },
            { Constants.Fields.DatasourceItem.Name, "Expedia Room Facilities" },
            new DbItem("Room Internet Type", expediaRoomTypeId, Constants.TemplateIds.FacilityType)
            {
                { Constants.Fields.DatasourceItem.Code, "100" },
                { Constants.Fields.DatasourceItem.Name, "Internet access" }
            }
        },
        new DbItem("Created Internet access", ID.NewID, Constants.TemplateIds.RoomFacility)
        {
            { Constants.Fields.BaseFacilityItem.FacilityType, string.Empty },
            { Constants.Fields.BaseFacilityItem.Name, string.Empty },
            { Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty }
        }
    })
            {
                var roomItem = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/Room 1");
                var roomFacilitiesFolder = db.GetItem("/sitecore/content/Hotel/Rooms - Expedia/Room 1/Facilities");

                var standardFacilityType = db.GetItem("/sitecore/content/Standard Facilities/Standard Type");
                var expediaPropertyFacilityType = db.GetItem("/sitecore/content/Expedia Property Facilities/Property Internet Type");
                var expediaRoomFacilityType = db.GetItem("/sitecore/content/Expedia Room Facilities/Room Internet Type");
                var createdFacilityItem = db.GetItem("/sitecore/content/Created Internet access");

                var facilities = new List<FacilityContent>
        {
            new FacilityContent
            {
                Code = "100",
                Name = "Internet access",
                Value = "Room internet value"
            }
        };

                searchDatasourceRepository
                    .GetAllItemsByCodes(
                        Arg.Is<List<string>>(x => x.Count == 1 && x.Contains("100")),
                        Constants.TemplateIds.FacilityType)
                    .Returns(new[] { standardFacilityType, expediaPropertyFacilityType, expediaRoomFacilityType });

                datasourceRepository
                    .GetOrCreateFolderItem(
                        roomItem,
                        Constants.Fields.AccommodationItem.Facilities,
                        Constants.TemplateIds.RoomFacilitiesFolder)
                    .Returns(roomFacilitiesFolder);

                datasourceRepository
                    .GetOrCreateItem(
                        expediaRoomFacilityType.Name,
                        Constants.TemplateIds.RoomFacility,
                        roomFacilitiesFolder,
                        true)
                    .Returns(createdFacilityItem);

                // Act
                service.Upsert(
                    roomItem,
                    facilities,
                    Constants.TemplateIds.RoomFacilitiesFolder,
                    Constants.TemplateIds.RoomFacility);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(
                    expediaRoomFacilityType.Name,
                    Constants.TemplateIds.RoomFacility,
                    roomFacilitiesFolder,
                    true);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    standardFacilityType.Name,
                    Constants.TemplateIds.RoomFacility,
                    roomFacilitiesFolder,
                    true);

                datasourceRepository.DidNotReceive().GetOrCreateItem(
                    expediaPropertyFacilityType.Name,
                    Constants.TemplateIds.RoomFacility,
                    roomFacilitiesFolder,
                    true);

                var latestCreatedFacilityItem = createdFacilityItem.Versions.GetLatestVersion();

                latestCreatedFacilityItem[Constants.Fields.BaseFacilityItem.FacilityType]
                    .Should().Be(expediaRoomFacilityType.ID.ToString());

                latestCreatedFacilityItem[Constants.Fields.AccommodationFacilityItem.TextValue]
                    .Should().Be("Room internet value");
            }
        }

        private SearchResults<HotelFacilitiesSearchResultItem> GetSearches(int totalResult, int shift = 0)
        {
            var hints = new List<SearchHit<HotelFacilitiesSearchResultItem>>();

            for (int i = 0 + shift; i < totalResult; i++)
            {
                hints.Add(new SearchHit<HotelFacilitiesSearchResultItem>(
                    i,
                    new HotelFacilitiesSearchResultItem
                    {
                        SourceCodes = new[] { $"{i}" },
                    }));
            }

            return new SearchResults<HotelFacilitiesSearchResultItem>(hints, totalResult);
        }

        private IEnumerable<string> GetCodes(int totalResult)
        {
            for (int i = 0; i < totalResult; i++)
            {
                yield return $"{i}";
            }
        }
    }
}