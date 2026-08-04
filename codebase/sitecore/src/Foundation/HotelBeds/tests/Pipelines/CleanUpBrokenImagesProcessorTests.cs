using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Pipelines.HotelBedsImagesResync;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Pipelines
{
    public class CleanUpBrokenImagesProcessorTests
    {
        private readonly IDestinationsRepository hotelsRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IHotelBedsLogger logger;
        private readonly IImagesService imagesService;
        private readonly CleanUpBrokenImagesProcessor cleanUpBrokenImagesProcessor;
        private readonly IDatabaseProvider databaseProvider;

        public CleanUpBrokenImagesProcessorTests()
        {
            hotelsRepository = Substitute.For<IDestinationsRepository>();
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IHotelBedsLogger>();
            imagesService = Substitute.For<IImagesService>();
            imagesService.CheckIfImageIsBroken(Arg.Any<string>()).Returns(true);
            databaseProvider = Substitute.For<IDatabaseProvider>();
            cleanUpBrokenImagesProcessor = new CleanUpBrokenImagesProcessor(hotelsRepository, syncDataService, databaseProvider, logger, imagesService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldCatchException_IfServiceThrowException(Db db, ID id)
        {
            // Arrange
            var parentItem = new DbItem("Parent", id);
            db.Add(parentItem);

            hotelsRepository.When(x => x.GetAllHotels(Arg.Any<string>())).Do(x => throw new Exception());

            var args = new DestinationPipelineArgs()
            {
                Parent = db.GetItem(id)
            };

            // Act
            cleanUpBrokenImagesProcessor.Process(args);

            // Assert
            logger.ReceivedWithAnyArgs().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            args.Aborted.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldNotResyncImages_IfThereAreNoBrokenImages(ID hotelDbItemID, string hotelBedsCode, string hbgImagePrefix, ID parentId)
        {
            // Arrange
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Small", hbgImagePrefix))
            using (Db db = new Db
            {
               new DbItem("Parent", parentId),
               new DbItem($"Hotel-{hotelBedsCode}", hotelDbItemID, Destinations.Constants.TemplateIds.Accommodation)
               {
                   new DbField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode) { Value = hotelBedsCode },
                   new DbItem("image1", new ID(), Destinations.Constants.TemplateIds.ExternalImage)
                   {
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Small) { Value = $"{hbgImagePrefix}-Small.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Medium) { Value = $"{hbgImagePrefix}-Medium.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Large) { Value = $"{hbgImagePrefix}-Large.jpg" }
                   },
                   new DbItem("image2", new ID(), Destinations.Constants.TemplateIds.ExternalImage)
                   {
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Small) { Value = "Small.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Medium) { Value = "Medium.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Large) { Value = "Large.jpg" }
                   }
               }
            })
            {
                var hints = new List<SearchHit<HotelSyncSearchResultItem>>
                {
                    {
                        new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                        {
                            Uri = new ItemUri(db.GetItem(hotelDbItemID)),
                            ItemId = hotelDbItemID,
                        })
                    }
                };

                databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(db.GetItem(hotelDbItemID));
                syncDataService.ResyncImages(Arg.Any<Dictionary<string, HotelItem>>()).ReturnsForAnyArgs(new List<Item> { db.GetItem(hotelDbItemID) });
                var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);

                hotelsRepository.GetAllHotels(Arg.Any<string>()).ReturnsForAnyArgs(results);

                var args = new DestinationPipelineArgs()
                {
                    Parent = db.GetItem(parentId)
                };

                imagesService.CheckIfImagesAreBroken(Arg.Any<string>()).ReturnsForAnyArgs(false);

                // Act
                cleanUpBrokenImagesProcessor.Process(args);

                // Assert
                syncDataService.DidNotReceive().ResyncImages(Arg.Any<Dictionary<string, HotelItem>>());
                logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldResyncImages(ID hotelDbItemID, string hotelBedsCode, string hbgImagePrefix, ID parentId, string imageFixerUserName)
        {
            // Arrange
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Small", hbgImagePrefix))
            using (new SettingsSwitcher("HotelBeds.ImageFixerUser", imageFixerUserName))
            using (Db db = new Db
            {
               new DbItem("Parent", parentId),
               new DbItem($"Hotel-{hotelBedsCode}", hotelDbItemID, Destinations.Constants.TemplateIds.Accommodation)
               {
                   new DbField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode) { Value = hotelBedsCode },
                   new DbItem("image1", new ID(), Destinations.Constants.TemplateIds.ExternalImage)
                   {
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Small) { Value = $"{hbgImagePrefix}-Small.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Medium) { Value = $"{hbgImagePrefix}-Medium.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Large) { Value = $"{hbgImagePrefix}-Large.jpg" }
                   },
                   new DbItem("image2", new ID(), Destinations.Constants.TemplateIds.ExternalImage)
                   {
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Small) { Value = "Small.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Medium) { Value = "Medium.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Large) { Value = "Large.jpg" }
                   }
               }
            })
            {
                var hints = new List<SearchHit<HotelSyncSearchResultItem>>
                {
                    {
                        new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                        {
                            Uri = new ItemUri(db.GetItem(hotelDbItemID)),
                            ItemId = hotelDbItemID,
                        })
                    }
                };

                databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(db.GetItem(hotelDbItemID));
                syncDataService.ResyncImages(Arg.Any<Dictionary<string, HotelItem>>()).ReturnsForAnyArgs(new List<Item> { db.GetItem(hotelDbItemID) });
                var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);

                hotelsRepository.GetAllHotels(Arg.Any<string>()).ReturnsForAnyArgs(results);

                var args = new DestinationPipelineArgs()
                {
                    Parent = db.GetItem(parentId)
                };

                imagesService.CheckIfImagesAreBroken(Arg.Any<string>()).ReturnsForAnyArgs(true);

                // Act
                cleanUpBrokenImagesProcessor.Process(args);

                // Assert
                syncDataService.Received().ResyncImages(Arg.Any<Dictionary<string, HotelItem>>());
                logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldNotResyncImages_IfImagesHaveWrongPrefix(ID hotelDbItemID, string hotelBedsCode, string hbgImagePrefix, ID parentId, string imageFixerUserName)
        {
            // Arrange
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Small", hbgImagePrefix))
            using (new SettingsSwitcher("HotelBeds.ImageFixerUser", imageFixerUserName))
            using (Db db = new Db
            {
               new DbItem("Parent", parentId),
               new DbItem($"Hotel-{hotelBedsCode}", hotelDbItemID, Destinations.Constants.TemplateIds.Accommodation)
               {
                   new DbField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode) { Value = hotelBedsCode },
                   new DbItem("image2", new ID(), Destinations.Constants.TemplateIds.ExternalImage)
                   {
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Small) { Value = "Small.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Medium) { Value = "Medium.jpg" },
                       new DbField(Destinations.Constants.Fields.ExternalImageItem.Large) { Value = "Large.jpg" }
                   }
               }
            })
            {
                var hints = new List<SearchHit<HotelSyncSearchResultItem>>
                {
                    {
                        new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                        {
                            Uri = new ItemUri(db.GetItem(hotelDbItemID)),
                            ItemId = hotelDbItemID,
                        })
                    }
                };

                databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(db.GetItem(hotelDbItemID));
                syncDataService.ResyncImages(Arg.Any<Dictionary<string, HotelItem>>()).ReturnsForAnyArgs(new List<Item> { db.GetItem(hotelDbItemID) });
                var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);

                hotelsRepository.GetAllHotels(Arg.Any<string>()).ReturnsForAnyArgs(results);

                var args = new DestinationPipelineArgs()
                {
                    Parent = db.GetItem(parentId)
                };

                imagesService.CheckIfImagesAreBroken(Arg.Any<string>()).ReturnsForAnyArgs(true);

                // Act
                cleanUpBrokenImagesProcessor.Process(args);

                // Assert
                syncDataService.DidNotReceive().ResyncImages(Arg.Any<Dictionary<string, HotelItem>>());
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }
    }
}
