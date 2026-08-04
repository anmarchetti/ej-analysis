using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using easyJet.Foundation.AmazonS3.Commands;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Commands
{
    public class ImportHotelImagesCommandTests
    {
        private readonly ImportHotelImagesCommandProxy command;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IHotelReportService hotelReportService;
        private readonly IJobStatusService jobStatusService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly ISyncDataService syncDataService;
        private readonly IUserCreationService userCreationService;
        private readonly IAmazonS3Logger logger;

        public ImportHotelImagesCommandTests()
        {
            logger = Substitute.For<IAmazonS3Logger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            hotelReportService = Substitute.For<IHotelReportService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            syncDataService = Substitute.For<ISyncDataService>();
            jobStatusService = Substitute.For<IJobStatusService>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);

            command = new ImportHotelImagesCommandProxy(
                logger,
                databaseProvider,
                destinationsRepository,
                hotelReportService,
                jobStatusService,
                userCreationService,
                sitecoreUiService,
                syncDataService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTemplateIsNotZip()
        {
            // Arrange - use FakeItem instead of FakeDb
            var mockItem = new FakeItem()
                .WithName("TestItem")
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();

            var commandContext = new CommandContext(mockItem);

            // Act
            var actual = command.IsCommandContextValidProxy(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfContextHasNoItems()
        {
            // Arrange
            var commandContext = new CommandContext();

            // Act
            var actual = command.IsCommandContextValidProxy(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void AllowedTemplates_ShouldContainZipTemplateId()
        {
            // Act & Assert
            command.AllowedTemplatesProxy.Should().Contain(Constants.TemplateIds.Zip);
        }

        [Fact]
        public void CommandTitle_ShouldReturnExpectedTitle()
        {
            // Act & Assert
            command.CommandTitleProxy.Should().Be("Import hotel images");
        }

        [Fact]
        public void GetFinalStatusMessage_ShouldReturnExpectedMessage()
        {
            // Act
            var result = command.GetFinalStatusMessageProxy(new List<Item>());

            // Assert
            result.Should().Be("Import hotel images completed");
        }

        [Fact]
        public void GetStatusMessage_ShouldReturnNull()
        {
            // Arrange - use FakeItem instead of FakeDb
            var mockItem = new FakeItem()
                .WithName("TestItem")
                .ToSitecoreItem();

            // Act
            var result = command.GetStatusMessageProxy(mockItem);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void PostAction_ShouldCallSitecoreUiService_ClientPage_SendMessage()
        {
            // Arrange
            var itemId = ID.NewID;
            var mockItem = new FakeItem(itemId)
                .WithName("Bulk Image Import")
                .ToSitecoreItem();

            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).Returns(_ => mockItem);
            var args = new ClientPipelineArgs();

            // Act
            command.PostActionProxy(args);

            // Assert
            sitecoreUiService.Received().ClientPage_SendMessage(
                Arg.Any<ImportHotelImagesCommand>(),
                Arg.Is<string>(s => s.Contains("item:refreshchildren") && s.Contains(itemId.ToString())));
        }

        [Fact]
        public void PostAction_ShouldCallDatabaseProvider_GetItem_WithImagesRootPath()
        {
            // Arrange
            var args = new ClientPipelineArgs();

            // Act
            command.PostActionProxy(args);

            // Assert
            databaseProvider.Received().GetItem(Arg.Any<string>(), DatabaseType.Master);
        }

        [Theory]
        [InlineData("TRAN0070", "concorde_deluxe")]
        [InlineData("MTMT0008", "qawra_palace")]
        [InlineData("EGHR0102", "hotel_name")]
        public void GetCode_ShouldExtractCodeFromItemName(string hotelCode, string suffix)
        {
            // Arrange
            var itemName = $"{hotelCode}_{suffix}";

            // Act - using reflection to test private method
            var method = typeof(ImportHotelImagesCommand).GetMethod("GetCode", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var mockItem = new FakeItem()
                .WithName(itemName)
                .ToSitecoreItem();

            var result = method?.Invoke(null, new object[] { mockItem });

            // Assert
            result.Should().Be(hotelCode);
        }

        [Fact]
        public void IsItemValid_ShouldReturnFalse_WhenItemHasNoBaseTemplate()
        {
            // Arrange - use FakeItem instead of FakeDb
            var mockItem = new FakeItem()
                .WithName("TestItem")
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();

            // Act - using reflection to test private method
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (bool)(method?.Invoke(null, new object[] { mockItem }) ?? true);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void DeleteImageItem_ShouldDeleteItem()
        {
            // Arrange
            var parentItem = new FakeItem()
                .WithName("ParentFolder");
            var childItem = new FakeItem()
                .WithName("ImageItem")
                .WithParent(parentItem);

            // Add another child to the parent so parent won't be deleted
            var siblingItem = new FakeItem()
                .WithName("SiblingItem")
                .WithParent(parentItem);

            // Act
            command.DeleteImageItemProxy(childItem.ToSitecoreItem());

            // Assert
            childItem.ToSitecoreItem().Received().Delete();
        }

        [Fact]
        public void DeleteImageItem_ShouldDeleteParent_WhenParentHasNoChildrenAfterDeletion()
        {
            // Arrange
            var parentItem = new FakeItem()
                .WithName("ParentFolder");
            var childItem = new FakeItem()
                .WithName("ImageItem")
                .WithParent(parentItem);

            // Setup parent to have no children after deletion (empty children collection)
            var parentSitecoreItem = parentItem.ToSitecoreItem();
            parentSitecoreItem.Children.Returns(Substitute.For<Sitecore.Collections.ChildList>(parentSitecoreItem, new Sitecore.Collections.ItemList()));

            // Act
            command.DeleteImageItemProxy(childItem.ToSitecoreItem());

            // Assert
            childItem.ToSitecoreItem().Received().Delete();
            parentSitecoreItem.Received().Delete();
        }

        [Fact]
        public void DeleteImageItemsAndZipItem_ShouldDeleteAllImageItemsAndContextItem()
        {
            // Arrange
            var contextItem = new FakeItem()
                .WithName("test_hotel.zip");

            var parentFolder = new FakeItem()
                .WithName("ImagesFolder");

            var imageItem1 = new FakeItem()
                .WithName("Image1")
                .WithParent(parentFolder);
            var imageItem2 = new FakeItem()
                .WithName("Image2")
                .WithParent(parentFolder);
            var imageItem3 = new FakeItem()
                .WithName("Image3")
                .WithParent(parentFolder);

            var imageItems = new[]
            {
                imageItem1.ToSitecoreItem(),
                imageItem2.ToSitecoreItem(),
                imageItem3.ToSitecoreItem()
            };

            // Act
            command.DeleteImageItemsAndZipItemProxy(contextItem.ToSitecoreItem(), imageItems);

            // Assert
            imageItem1.ToSitecoreItem().Received().Delete();
            imageItem2.ToSitecoreItem().Received().Delete();
            imageItem3.ToSitecoreItem().Received().Delete();
            contextItem.ToSitecoreItem().Received().Delete();
        }

        [Fact]
        public void DeleteImageItemsAndZipItem_ShouldDeleteOnlyContextItem_WhenNoImageItems()
        {
            // Arrange
            var contextItem = new FakeItem()
                .WithName("test_hotel.zip");

            var imageItems = Array.Empty<Item>();

            // Act
            command.DeleteImageItemsAndZipItemProxy(contextItem.ToSitecoreItem(), imageItems);

            // Assert
            contextItem.ToSitecoreItem().Received().Delete();
            logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void DeleteImageItemsAndZipItem_ShouldNotDeleteContextItem_WhenNull()
        {
            // Arrange
            var imageItems = Array.Empty<Item>();

            // Act
            command.DeleteImageItemsAndZipItemProxy(null, imageItems);

            // Assert
            logger.DidNotReceive().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetItemDestination_ShouldNotContainInvalidItemNameCharacters_WhenZipEntryHasSpecialCharacters()
        {
            const string parentPath = "/sitecore/media library/Bulk Image Import";
            const string invalidChars = "\\/:?\"<>|[]";

            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    archive.CreateEntry("room[101]:view/photo?.jpg");
                }

                memoryStream.Position = 0;

                using (var readArchive = new ZipArchive(memoryStream, ZipArchiveMode.Read))
                {
                    var entry = readArchive.Entries[0];

                    var method = typeof(ImportHotelImagesCommand).GetMethod("GetItemDestination", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
                    var result = (string)method.Invoke(null, new object[] { entry, parentPath });

                    result.Should().StartWith(parentPath + "/");
                    var relativePath = result.Substring(parentPath.Length + 1);
                    foreach (var segment in relativePath.Split('/'))
                    {
                        foreach (var c in invalidChars)
                        {
                            segment.Should().NotContain(c.ToString());
                        }
                    }
                }
            }
        }

        [Theory]
        [InlineData("image.jpg", "/sitecore/media library/Bulk Image Import", "/sitecore/media library/Bulk Image Import/image")]
        [InlineData("hotel_photo.png", "/media/images", "/media/images/hotel_photo")]
        [InlineData("test.gif", "/root", "/root/test")]
        public void GetItemDestination_ShouldReturnCorrectPath_WhenEntryHasNoDirectory(string fileName, string parentPath, string expectedPath)
        {
            // Arrange
            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    archive.CreateEntry(fileName);
                }

                memoryStream.Position = 0;

                using (var readArchive = new ZipArchive(memoryStream, ZipArchiveMode.Read))
                {
                    var entry = readArchive.Entries[0];

                    // Act - using reflection to test private method
                    var method = typeof(ImportHotelImagesCommand).GetMethod("GetItemDestination", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
                    var result = method?.Invoke(null, new object[] { entry, parentPath });

                    // Assert
                    result.Should().Be(expectedPath);
                }
            }
        }

        [Theory]
        [InlineData("room-01", "room-01")]
        [InlineData("room:01", "room01")]
        [InlineData("  ", "")]
        public void SanitizeItemNameSegment_ShouldReturnExpectedValue(string input, string expected)
        {
            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("SanitizeItemNameSegment", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (string)method?.Invoke(null, new object[] { input });

            // Assert
            result.Should().Be(expected);
        }

        [Theory]
        [InlineData("folder/sub/image.jpg", "folder/sub", "image.jpg")]
        [InlineData("image.jpg", "", "image.jpg")]
        [InlineData("folder/sub/", "folder/sub", "")]
        public void ResolveZipEntryDirectory_ShouldReturnExpectedDirectory(string fullName, string expectedDirectory, string entryName)
        {
            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("ResolveZipEntryDirectory", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (string)method?.Invoke(null, new object[] { fullName, entryName });

            // Assert
            result.Should().Be(expectedDirectory);
        }

        [Fact]
        public void GetSafeZipEntryFileName_ShouldReturnFallback_WhenEntryNameIsEmpty()
        {
            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("GetSafeZipEntryFileName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (string)method?.Invoke(null, new object[] { string.Empty });

            // Assert
            result.Should().Be("file");
        }

        [Fact]
        public void GetSafeZipEntryFileName_ShouldKeepExtension_WhenPresent()
        {
            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("GetSafeZipEntryFileName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (string)method?.Invoke(null, new object[] { "folder/sub/image-file.png" });

            // Assert
            result.Should().Be("image-file.png");
        }

        [Fact]
        public void IsKeepOriginalEnabled_ShouldReturnFalse_WhenContextUserIsMissing()
        {
            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsKeepOriginalEnabled", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = (bool)(method?.Invoke(null, null) ?? true);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("TRAN0070_concorde_deluxe", "TRAN0070")]
        [InlineData("MTMT0008_qawra_palace", "MTMT0008")]
        [InlineData("EGHR0102_hotel_name", "EGHR0102")]
        public void IsZipItemValid_ShouldReturnTrue_WhenHotelFoundOnFirstSearch(string itemName, string expectedCode)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { expectedCode },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            var zipItem = new FakeItem().WithName(itemName).ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var result = (ValueTuple<bool, string, SearchHit<HotelSearchResultItem>>)method.Invoke(command, new object[] { zipItem });

            // Assert
            result.Item1.Should().BeTrue();
            result.Item2.Should().Be(expectedCode);
            result.Item3.Should().NotBeNull();
        }

        [Fact]
        public void IsZipItemValid_ShouldReturnTrue_WhenHotelFoundOnRetry()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            var resultsWithHotel = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults, resultsWithHotel);

            var zipItem = new FakeItem().WithName("TRAN0070_concorde_deluxe").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var result = (ValueTuple<bool, string, SearchHit<HotelSearchResultItem>>)method.Invoke(command, new object[] { zipItem });

            // Assert
            result.Item1.Should().BeTrue();
            result.Item2.Should().Be("TRAN0070");
            result.Item3.Should().NotBeNull();
        }

        [Fact]
        public void IsZipItemValid_ShouldReturnFalse_WhenHotelNotFound()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("UNKNOWN_hotel").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            var result = (ValueTuple<bool, string, SearchHit<HotelSearchResultItem>>)method.Invoke(command, new object[] { zipItem });

            // Assert
            result.Item1.Should().BeFalse();
            result.Item2.Should().Be("UNKNOWN");
            result.Item3.Should().BeNull();
        }

        [Fact]
        public void IsZipItemValid_ShouldCallSearchHotelsByCodes_WithExtractedCode()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("EGHR0102_beach_resort").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method.Invoke(command, new object[] { zipItem });

            // Assert
            destinationsRepository.Received().SearchHotelsByCodes(Arg.Is<string[]>(codes => codes.Length == 1 && codes[0] == "EGHR0102"));
        }

        [Fact]
        public void IsZipItemValid_ShouldReportWarning_WhenHotelNotFound()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("BADCODE_images").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method.Invoke(command, new object[] { zipItem });

            // Assert
            hotelReportService.Received().Warn("BADCODE", "BADCODE_images", "Hotel was not found.");
        }

        [Fact]
        public void IsZipItemValid_ShouldRetrySearch_WhenFirstSearchReturnsNull()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method.Invoke(command, new object[] { zipItem });

            // Assert - should have been called twice (initial search + retry)
            destinationsRepository.Received(2).SearchHotelsByCodes(Arg.Any<string[]>());
        }

        [Fact]
        public void IsZipItemValid_ShouldNotRetry_WhenFirstSearchFindsHotel()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();

            // Act
            var method = typeof(ImportHotelImagesCommand).GetMethod("IsZipItemValid", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            method.Invoke(command, new object[] { zipItem });

            // Assert - should have been called only once
            destinationsRepository.Received(1).SearchHotelsByCodes(Arg.Any<string[]>());
        }

        [Fact]
        public void ProcessItems_ShouldReturnEmpty_WhenZipItemIsInvalid()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("UNKNOWN_hotel").ToSitecoreItem();

            // Act
            var result = command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void ProcessItems_ShouldLogWarning_WhenZipItemIsInvalid()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("BADCODE_images").ToSitecoreItem();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            jobStatusService.Received().AddStatusMessage(Arg.Is<string>(s => s.Contains("is invalid")));
        }

        [Fact]
        public void ProcessItems_ShouldNotCallSyncDataService_WhenZipItemIsInvalid()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("UNKNOWN_hotel").ToSitecoreItem();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            syncDataService.DidNotReceive().SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<bool>());
            syncDataService.DidNotReceive().GetImageFolder(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ProcessItems_ShouldNotCallDeleteImageItemsAndZipItem_WhenZipItemIsInvalid()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("UNKNOWN_hotel").ToSitecoreItem();
            command.EnableDeleteTracking();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            command.DeleteImageItemsAndZipItemWasCalled.Should().BeFalse();
        }

        [Fact]
        public void ProcessItems_ShouldReportHotelWarning_WhenZipItemIsInvalid()
        {
            // Arrange
            var emptyResults = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>>(), 0);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(emptyResults);

            var zipItem = new FakeItem().WithName("BADCODE_images").ToSitecoreItem();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            hotelReportService.Received().Warn("BADCODE", "BADCODE_images", "Hotel was not found.");
        }

        [Fact]
        public void ProcessItems_ShouldCallDatabaseProviderGetItem_WhenZipItemIsValid()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();
            command.EnableDeleteTracking();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            databaseProvider.Received().GetItem(Arg.Any<ItemUri>());
        }

        [Fact]
        public void ProcessItems_ShouldCallDeleteImageItemsAndZipItem_WhenZipItemIsValid()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();
            command.EnableDeleteTracking();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            command.DeleteImageItemsAndZipItemWasCalled.Should().BeTrue();
        }

        [Fact]
        public void ProcessItems_ShouldNotCallSyncDataService_WhenNoImagesUnpacked()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();
            command.EnableDeleteTracking();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert - no images unpacked means no sync calls
            syncDataService.DidNotReceive().SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<bool>());
        }

        [Fact]
        public void ProcessItems_ShouldNotCallSyncDataService_WhenErrorIsThrown()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            var results = new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Throws<Exception>();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);

            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();
            command.EnableDeleteTracking();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert - no images unpacked means no sync calls
            syncDataService.DidNotReceive().SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<bool>());
            logger.Received().Error($"{nameof(ImportHotelImagesCommand)}", Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void ProcessItems_ShouldSyncUnpackedItems_WhenZipItemIsValid()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var folderItem = new FakeItem().ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>())
                .Returns(new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1));
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);
            syncDataService.GetImageFolder(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(folderItem);

            var unpackedImage = new FakeItem().WithName("TRAN0070_room").ToSitecoreItem();
            command.ForceItemsValid = true;
            command.UnpackedItems = new[] { unpackedImage };
            command.EnableDeleteTracking();
            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            syncDataService.Received(1).GetImageFolder(hotelItem, "TRAN0070", "TRAN0070_room", "TRAN0070");
            syncDataService.Received(1).SyncImage(folderItem, unpackedImage, "TRAN0070", Arg.Any<bool>());
            command.DeleteImageItemsAndZipItemWasCalled.Should().BeTrue();
        }

        [Fact]
        public void ProcessItems_ShouldResolveFolderOnce_WhenMultipleImagesShareCode()
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var folderItem = new FakeItem().ToSitecoreItem();
            var searchHit = new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
            {
                SourceCodes = new[] { "TRAN0070" },
                ItemId = hotelItem.ID,
                ItemName = hotelItem.Name,
                Uri = hotelItem.Uri
            });
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>())
                .Returns(new SearchResults<HotelSearchResultItem>(new List<SearchHit<HotelSearchResultItem>> { searchHit }, 1));
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);
            syncDataService.GetImageFolder(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(folderItem);

            command.ForceItemsValid = true;
            command.UnpackedItems = new[]
            {
                new FakeItem().WithName("TRAN0070_room1").ToSitecoreItem(),
                new FakeItem().WithName("TRAN0070_room2").ToSitecoreItem()
            };
            command.EnableDeleteTracking();
            var zipItem = new FakeItem().WithName("TRAN0070_hotel").ToSitecoreItem();

            // Act
            command.ProcessItemsProxy(zipItem, new ClientPipelineArgs()).ToList();

            // Assert
            syncDataService.Received(1).GetImageFolder(hotelItem, "TRAN0070", Arg.Any<string>(), "TRAN0070");
            syncDataService.Received(2).SyncImage(folderItem, Arg.Any<Item>(), "TRAN0070", Arg.Any<bool>());
        }

        /// <summary>
        /// Proxy class to expose protected members for testing.
        /// </summary>
        private class ImportHotelImagesCommandProxy : ImportHotelImagesCommand
        {
            private bool trackDeleteCalls;

            public ImportHotelImagesCommandProxy(
                IAmazonS3Logger logger,
                IDatabaseProvider databaseProvider,
                IDestinationsRepository destinationsRepository,
                IHotelReportService hotelReportService,
                IJobStatusService jobStatusService,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService,
                ISyncDataService syncDataService)
                : base(logger, databaseProvider, destinationsRepository, hotelReportService, jobStatusService, userCreationService, sitecoreUiService, syncDataService)
            {
            }

            public bool DeleteImageItemsAndZipItemWasCalled { get; private set; }

            public IEnumerable<Item> UnpackedItems { get; set; }

            public bool ForceItemsValid { get; set; }

            public void EnableDeleteTracking()
            {
                trackDeleteCalls = true;
            }

            public bool IsCommandContextValidProxy(CommandContext context)
            {
                if (context?.Items == null || context.Items.Length == 0)
                {
                    return false;
                }

                return IsCommandContextValid(context);
            }

            protected override void DeleteImageItemsAndZipItem(Item contextItem, Item[] imageItems)
            {
                if (trackDeleteCalls)
                {
                    DeleteImageItemsAndZipItemWasCalled = true;
                    return;
                }

                base.DeleteImageItemsAndZipItem(contextItem, imageItems);
            }

            protected override IEnumerable<Item> UnpackZipItem(Item zipItem)
            {
                return UnpackedItems ?? base.UnpackZipItem(zipItem);
            }

            protected override bool IsItemValidForSync(Item item)
            {
                return ForceItemsValid || base.IsItemValidForSync(item);
            }

            public HashSet<ID> AllowedTemplatesProxy => AllowedTemplates;

            public string CommandTitleProxy => CommandTitle;

            public string GetFinalStatusMessageProxy(List<Item> processedItems) => GetFinalStatusMessage(processedItems);

            public string GetStatusMessageProxy(Item item) => GetStatusMessage(item);

            public void PostActionProxy(ClientPipelineArgs args) => PostAction(args);

            public IEnumerable<Item> ProcessItemsProxy(Item contextItem, ClientPipelineArgs args) => ProcessItems(contextItem, args);

            public void DeleteImageItemProxy(Item item) => DeleteImageItem(item);

            public void DeleteImageItemsAndZipItemProxy(Item contextItem, Item[] imageItems) => DeleteImageItemsAndZipItem(contextItem, imageItems);
        }
    }
}
