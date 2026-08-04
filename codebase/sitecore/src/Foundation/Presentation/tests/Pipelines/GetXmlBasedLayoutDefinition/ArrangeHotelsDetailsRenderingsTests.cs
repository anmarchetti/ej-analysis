using System.Collections.Generic;
using System.Web;
using System.Xml.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetXmlBasedLayoutDefinition
{
    public class ArrangeHotelsDetailsRenderingsTests
    {
        private readonly ILayoutXmlService service;
        private readonly IHtmlCacheRepository cache;
        private readonly ArrangeHotelsDetailsRenderings processor;
        private readonly IPresentationLogger logger;
        private readonly IDatabaseProvider databaseProvider;

        public ArrangeHotelsDetailsRenderingsTests()
        {
            service = Substitute.For<ILayoutXmlService>();
            cache = Substitute.For<IHtmlCacheRepository>();
            logger = Substitute.For<IPresentationLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            processor = new ArrangeHotelsDetailsRenderings(cache, service, logger, databaseProvider);
            processor.AddWebsite("Holidays");
        }

        [Theory]
        [AutoData]
        public void Process_ShouldArrangeRenderings_IfPageDesignHasRequiredTheme(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;

            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                        {
                           Value = "HOTELCODE"
                        }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", "theme=beach"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.Received().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldArrangeRenderings_IfPageDesignHasRequiredAccId(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.Received().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldArrangeRenderings_IfPageDesignHasDuplicateHotelCode(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelDuplicateId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                        {
                            Value = hotelCode
                        }
                    }
                },
                new DbItem("HotelDuplicate", hotelDuplicateId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                       new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);

                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = $"{hotelId}|{hotelDuplicateId}";
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
                    service.Received().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfPageDesignHasNoVersion(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelDuplicateId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            var hotelCode = "HOTELCODE";
            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                        {
                            Value = hotelCode
                        }
                    }
                },
                new DbItem("HotelDuplicate", hotelDuplicateId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                       new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId, "de-DE");
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);
                cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>())
                    .Returns(new Dictionary<string, Item>()
                    {
                        { hotelCode, hotelDesignItem }
                    });

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));
                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldArrangeRenderings_IfPageDesignHasDuplicateTheme(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelThemeDubplicateId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                        {
                           Value = hotelCode
                        }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Beach Theme", hotelThemeDubplicateId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDuplicateTheme = db.GetItem(hotelThemeDubplicateId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = $"{hotelId}";
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                using (new EditContext(hotelDuplicateTheme))
                {
                    hotelDuplicateTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.Theme}=Beach"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
                    service.Received().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfPageDesignIsNotPublishable(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                        {
                           Value = hotelCode
                        }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                    hotelDesignItem.Fields[Sitecore.FieldIDs.NeverPublish].Value = "1";
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfHotelDetailsPageHasWrongTemplate(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDesign.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfQueryStringIsEmpty(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);
                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", string.Empty), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfPageDesignIsEmpty(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);
                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfPageDesignFolderIsNotFound(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId)
        {
            // Arrange
            Dictionary<string, Item> cachedDictionary = null;
            var hotelCode = "HOTELCODE";
            cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>()).Returns(cachedDictionary);

            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsNullForAnyArgs();
                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.AccommadationId}={hotelCode}"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotArrangeRenderings_IfPageDesignHasNotRequiredTheme(
            ID hotelDetailsPageId,
            ID hotelDesignsFolder,
            ID hotelId,
            ID hotelThemeId,
            ID hotelDesignId)
        {
            // Arrange
            var hotelCode = "HOTELCODE";
            using (Db db = new Db
            {
                new DbTemplate("Presentation", Templates.Presentation.Id),
                new DbTemplate("Hotel Design Folder", Templates.HotelDesignsFolder.Id),
                new DbTemplate("Hotel Design", Templates.HotelDesign.Id) { Templates.HotelDesign.Fields.Hotels },
                new DbTemplate("Hotel Theme Design", Templates.HotelThemeDesign.Id) { Templates.HotelThemeDesign.Fields.Theme },
                new DbTemplate("Hotel Details Page", Templates.HotelDetailsPage.Id),
                new DbItem("Hotel", hotelId)
                {
                    new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                       {
                           Value = hotelCode
                       }
                    }
                },
                new DbItem("Hotel Details Page", hotelDetailsPageId, Templates.HotelDetailsPage.Id),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Hotel Designs Folder", hotelDesignsFolder, Templates.HotelDesignsFolder.Id)
                    {
                         new DbItem("Beach Theme", hotelThemeId, Templates.HotelThemeDesign.Id),
                         new DbItem("Hotel Design Theme", hotelDesignId, Templates.HotelDesign.Id),
                    }
                }
            })
            {
                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                var hotelDesignItem = db.GetItem(hotelDesignId);
                var hotelTheme = db.GetItem(hotelThemeId);

                cache.GetItem<Dictionary<string, Item>>(Arg.Any<string>())
                    .Returns(new Dictionary<string, Item>()
                    {
                        { "CITY", hotelTheme }
                    });

                var hotelDesignFolder = db.GetItem(hotelDesignsFolder);
                databaseProvider.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(hotelDesignFolder);

                using (new EditContext(hotelDesignItem))
                {
                    hotelDesignItem.Fields[Templates.HotelDesign.Fields.Hotels].Value = hotelId.ToString();
                }

                using (new EditContext(hotelTheme))
                {
                    hotelTheme.Fields[Templates.HotelThemeDesign.Fields.Theme].Value = "Beach";
                }

                HttpContext.Current = new HttpContext(new HttpRequest(null, "http://tempuri.org", $"{Constants.QueryStringParams.Theme}=beach"), new HttpResponse(null));

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    // Act
                    processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = db.GetItem(hotelDetailsPageId) });

                    // Assert
                    cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, Item>>());
                    service.DidNotReceive().ArrangeRenderings(Arg.Any<XElement>(), Arg.Any<Item>());
                }
            }
        }
    }
}
