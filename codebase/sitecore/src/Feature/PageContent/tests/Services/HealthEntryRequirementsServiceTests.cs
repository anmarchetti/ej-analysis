using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Services;
using easyJet.Feature.PageContent.Tests.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Services
{
    public class HealthEntryRequirementsServiceTests
    {
        private readonly HtmlCacheRepository cache;
        private readonly HealthEntryRequirementsService healthEntryRequirementsService;

        public HealthEntryRequirementsServiceTests()
        {
            // Arrange
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            healthEntryRequirementsService = new HealthEntryRequirementsService(cache);
        }

        [Theory]
        [AutoData]
        public void Get_ShouldReturnHealthRequirementByCode_IfDbHasBlockWithAirportCode(string airportCode, ID requirementTile1, ID requirementTile2)
        {
            // Arrange
            IEnumerable<HealthEntryRequirementTile> healthEntryRequirementTiles = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementTile>>(Arg.Any<string>()).Returns(healthEntryRequirementTiles);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementTile>>()).Returns(healthEntryRequirementTiles);

            IEnumerable<HealthEntryRequirementBlock> healthEntryRequirementblocks = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementBlock>>(Arg.Any<string>()).Returns(healthEntryRequirementblocks);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementBlock>>()).Returns(healthEntryRequirementblocks);

            ID airportItemId = ID.NewID;
            string healthRequirements = $"{requirementTile1}|{requirementTile2}";

            var fakeSiteContext = new FakeSiteContext(
               new StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 1")
                        {
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 1", requirementTile1),
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 2", requirementTile2)
                        },
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 2")
                        {
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 4"),
                        },
                        new HealthRequirementBlockDbItem(airportItemId.ToString(), healthRequirements, "Health Entry Requirement Block 3")
                        {
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 7"),
                        }
                    }
                },
                new DbItem("Airport", airportItemId)
                {
                    new DbField("Code")
                    {
                        Value = airportCode
                    }
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.Get(airportCode);

                // Assert
                actual.Should().HaveCount(2);
            }
        }

        [Theory]
        [AutoData]
        public void Get_ShouldReturnDefaultHealthRequirements_IfDbHasBlockWithAirportCode(string airportCode, ID requirementTile1, ID requirementTile7)
        {
            // Arrange
            IEnumerable<HealthEntryRequirementTile> healthEntryRequirementTiles = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementTile>>(Arg.Any<string>()).Returns(healthEntryRequirementTiles);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementTile>>()).Returns(healthEntryRequirementTiles);

            IEnumerable<HealthEntryRequirementBlock> healthEntryRequirementblocks = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementBlock>>(Arg.Any<string>()).Returns(healthEntryRequirementblocks);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementBlock>>()).Returns(healthEntryRequirementblocks);

            string healthRequirements = $"{requirementTile7}";

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 1")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 1", requirementTile1),
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 2")
                        },
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 2")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 4"),
                        },
                        new HealthRequirementBlockDbItem(string.Empty, healthRequirements, "1", "Health Entry Requirement Block Defualt")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 7", requirementTile7),
                        }
                    }
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.Get(airportCode);

                // Assert
                actual.Should().HaveCount(1);
            }
        }

        [Theory]
        [AutoData]
        public void GetFlightAndHotelHealthEntryRequirements_ShouldReturnHealthRequirementByCode_FromFlightAndHotelFolder(string airportCode, ID requirementTile1, ID requirementTile2, ID requirementTile3)
        {
            // Arrange
            IEnumerable<HealthEntryRequirementTile> healthEntryRequirementTiles = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementTile>>(Arg.Any<string>()).Returns(healthEntryRequirementTiles);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementTile>>()).Returns(healthEntryRequirementTiles);

            IEnumerable<HealthEntryRequirementBlock> healthEntryRequirementblocks = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementBlock>>(Arg.Any<string>()).Returns(healthEntryRequirementblocks);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementBlock>>()).Returns(healthEntryRequirementblocks);

            ID airportItemId = ID.NewID;
            string defaultFolderHealthRequirements = $"{requirementTile1}";
            string flightAndHotelHealthRequirements = $"{requirementTile2}|{requirementTile3}";

            var fakeSiteContext = new FakeSiteContext(
               new StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem(airportItemId.ToString(), defaultFolderHealthRequirements, "Health Entry Requirement Block 1")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 1", requirementTile1)
                        }
                    },
                    new DbItem(Constants.ItemNames.FlightAndHotelHealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem(airportItemId.ToString(), flightAndHotelHealthRequirements, "Health Entry Requirement Block 2")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 2", requirementTile2),
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 3", requirementTile3)
                        }
                    }
                },
                new DbItem("Airport", airportItemId)
                {
                    new DbField("Code")
                    {
                        Value = airportCode
                    }
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.GetFlightAndHotelHealthEntryRequirements(airportCode);

                // Assert
                actual.Should().HaveCount(2);
            }
        }

        [Theory]
        [AutoData]
        public void Get_ShouldBeEmpty_IfNoDefaultBlocksInDb(string airportCode, ID requirementTile1, ID requirementTile7)
        {
            // Arrange
            IEnumerable<HealthEntryRequirementTile> healthEntryRequirementTiles = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementTile>>(Arg.Any<string>()).Returns(healthEntryRequirementTiles);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementTile>>()).Returns(healthEntryRequirementTiles);

            IEnumerable<HealthEntryRequirementBlock> healthEntryRequirementblocks = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementBlock>>(Arg.Any<string>()).Returns(healthEntryRequirementblocks);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementBlock>>()).Returns(healthEntryRequirementblocks);

            string healthRequirements = $"{requirementTile7}";

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 1")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 1", requirementTile1),
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 2")
                        },
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 2")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 4"),
                        },
                        new HealthRequirementBlockDbItem(string.Empty, healthRequirements, "Health Entry Requirement Block Defualt")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 7", requirementTile7),
                        }
                    }
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.Get(airportCode);

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetAll_ShouldReturnHealthRequirement_IfDbHasBlock()
        {
            // Arrange
            IEnumerable<HealthEntryRequirementTile> healthEntryRequirementTiles = null;
            cache.GetItem<IEnumerable<HealthEntryRequirementTile>>(Arg.Any<string>()).Returns(healthEntryRequirementTiles);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HealthEntryRequirementTile>>()).Returns(healthEntryRequirementTiles);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 1")
                        {
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 1"),
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 2")
                        },
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 2")
                        {
                             new HealthRequirementTileDbItem("Health Entry Requirement Tile 4"),
                        }
                    }
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.GetAll();

                // Assert
                actual.Should().HaveCount(2);
            }
        }

        [Fact]
        public void GetAll_ShouldBeEmpty_IfDbHasNoBlock()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
               new StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem(Constants.ItemNames.HealthEntryRequirementsFolder, ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                }
            })
            {
                // Act
                var actual = healthEntryRequirementsService.GetAll();

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetAll_ShouldBeEmpty_IfDbHasNoFolder()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
               new StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (Db db = new Db
            {
                new DbItem("Data")
            })
            {
                // Act
                var actual = healthEntryRequirementsService.GetAll();

                // Assert
                actual.Should().BeEmpty();
            }
        }
    }
}
