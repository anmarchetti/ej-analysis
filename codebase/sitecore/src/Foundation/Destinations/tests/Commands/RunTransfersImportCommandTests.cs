using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunTransfersImportCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly BaseMediaManager mediaManager;

        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly ITransfersInfoSearchService transfersInfoSearchService;
        private readonly ITransferInfoSearchSettings settings;
        private readonly RunTransfersImportCommand runTransfersImportCommand;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IIndexingService indexingService;
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunTransfersImportCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            mediaManager = Substitute.For<BaseMediaManager>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            transfersInfoSearchService = Substitute.For<ITransfersInfoSearchService>();
            settings = Substitute.For<ITransferInfoSearchSettings>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            indexingService = Substitute.For<IIndexingService>();
            sitecoreContextProvider = Substitute.For<ISitecoreContextProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runTransfersImportCommand = Substitute.ForPartsOf<RunTransfersImportCommand>(mediaManager, csvUtilsService, destinationsLogger, transfersInfoSearchService, databaseProvider, settings, indexingService, sitecoreContextProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldNotBeTrue_FileTypeIsNotValid()
        {
            // Arrange
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            transferInfoFolderDBItem.TemplateID = Constants.TemplateIds.TranserInfoFolder;

            var transfersFileDBItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.TransferInfoFolder.ImportFile)
            {
                Type = "FileField",
                Value = transfersFileDBItem.ID.ToString()
            };

            transferInfoFolderDBItem.Fields.Add(importFileField);

            Db.Add(transfersFileDBItem);
            Db.Add(transferInfoFolderDBItem);

            var commandContext = new CommandContext(Db.GetItem(transferInfoFolderDBItem.ID));

            // Act
            var actual = runTransfersImportCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTemplateIsNotValid()
        {
            // Arrange
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            transferInfoFolderDBItem.TemplateID = Constants.TemplateIds.Accommodation;
            Db.Add(transferInfoFolderDBItem);

            var commandContext = new CommandContext(Db.GetItem(transferInfoFolderDBItem.ID));

            // Act
            var actual = runTransfersImportCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var transfersFileDBItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.TransferInfoFolder.ImportFile)
            {
                Type = "FileField",
                Value = transfersFileDBItem.ID.ToString()
            };

            transferInfoFolderDBItem.Fields.Add(importFileField);

            Db.Add(transferInfoFolderDBItem);
            Db.Add(transfersFileDBItem);

            // Act
            var actual = runTransfersImportCommand.ProcessItems(Db.GetItem(transferInfoFolderDBItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<TransferInfo> transferInfos)
        {
            // Arrange
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var transfersFileDbItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var transferInfoItems = CreateTransferInfoItems(3);

            foreach (var transferInfoItem in transferInfoItems)
            {
                transferInfoFolderDBItem.Children.Add(transferInfoItem);
            }

            var importFileField = new DbField(Constants.Fields.TransferInfoFolder.ImportFile)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{transfersFileDbItem.ID.ToString()}\" />"
            };

            var languageMappingField = new DbField(Constants.Fields.TransferInfoFolder.LanguageMapping)
            {
                Type = "NameValueList",
                Value = $"de-DE=de&de-CH=de&fr-FR=fr&fr-CH=fr&en=en"
            };

            transferInfoFolderDBItem.Fields.Add(importFileField);
            transferInfoFolderDBItem.Fields.Add(languageMappingField);

            var transferInfoTemplate = CreateTransferInfoTemplate();
            Db.Add(transferInfoTemplate);
            Db.Add(transferInfoFolderDBItem);
            Db.Add(transfersFileDbItem);
            var transferInfoDbItem = Db.GetItem(transferInfoItems.First().FullPath);

            var hits = new List<SearchHit<BaseTransferInfoSearchResultItem>>();

            foreach (var transferInfo in transferInfos)
            {
                transferInfo.TransfersMinutes = "1";
                transferInfo.ArrivalInstr = new Dictionary<string, string>()
                {
                    { "en", "This is a english text" }
                };
                transferInfo.DepInstr = new Dictionary<string, string>()
                {
                    { "en", "This is a english text" },
                    { "de", "Das ist ein deutscher Text" }
                };

                hits.Add(new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem
                {
                    ProductId = transferInfo.ProductId,
                    Uri = transferInfoDbItem.Uri,
                    Language = "en"
                }));
            }

            var mediaItem = new MediaItem(Db.GetItem(transfersFileDbItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().Returns(mediaStream);
            }

            runTransfersImportCommand.GetFileData<TransferInfo>(Arg.Any<Item>()).ReturnsForAnyArgs(transferInfos);

            transfersInfoSearchService.GetTransfersInfoByProductIds(Arg.Any<string[]>(), Arg.Any<int>())
                .ReturnsForAnyArgs(hits.Select(t => t.Document).ToList());

            // Act
            var actual = runTransfersImportCommand.ProcessItems(Db.GetItem(transferInfoFolderDBItem.ID));

            // Assert
            actual.Count().Should().Be(9);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnNotItems_IfProductIdIsEmpty(TransferInfo transferInfo)
        {
            // Arrange
            transferInfo.ProductId = string.Empty;
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var transfersFileDBItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var transferInfoDbItem = CreateTransferInfoItems(1).First();
            transferInfoFolderDBItem.Children.Add(transferInfoDbItem);

            var importFileField = new DbField(Constants.Fields.TransferInfoFolder.ImportFile)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{transfersFileDBItem.ID.ToString()}\" />"
            };

            var languageMappingField = new DbField(Constants.Fields.TransferInfoFolder.LanguageMapping)
            {
                Type = "NameValueList",
                Value = $"de-DE=de&de-CH=de&fr-FR=fr&fr-CH=fr&en=en"
            };

            transferInfoFolderDBItem.Fields.Add(importFileField);
            transferInfoFolderDBItem.Fields.Add(languageMappingField);

            var transferInfoTemplate = new DbTemplate("TransferInfoTemplate", Constants.TemplateIds.TransferInfo);
            transferInfo.TransfersMinutes = "1";
            transferInfo.ArrivalInstr = new Dictionary<string, string>()
            {
                { "en", "This is a english text" }
            };
            transferInfo.DepInstr = new Dictionary<string, string>()
            {
                { "en", "This is a english text" },
                { "de", "Das ist ein deutscher Text" }
            };

            Db.Add(transferInfoTemplate);
            Db.Add(transferInfoFolderDBItem);
            Db.Add(transfersFileDBItem);

            var transferInfoItem = Db.GetItem(transferInfoDbItem.FullPath);
            var mediaItem = new MediaItem(Db.GetItem(transfersFileDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().Returns(mediaStream);
            }

            var transferInfos = new List<TransferInfo> { transferInfo };
            runTransfersImportCommand.GetFileData<TransferInfo>(Arg.Any<Item>()).ReturnsForAnyArgs(transferInfos);

            var hits = new List<SearchHit<BaseTransferInfoSearchResultItem>>()
            {
                new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem()
                {
                    ProductId = transferInfo.ProductId,
                    Uri = transferInfoItem.Uri,
                    Language = "en"
                })
            };

            transfersInfoSearchService.GetTransfersInfoByProductIds(Arg.Any<string[]>(), Arg.Any<int>())
                .ReturnsForAnyArgs(hits.Select(t => t.Document).ToList());

            // Act
            var actual = runTransfersImportCommand.ProcessItems(Db.GetItem(transferInfoFolderDBItem.ID));

            // Assert
            actual.Count().Should().Be(0);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldNotReturnItems_IfDurationIsInvalid(List<TransferInfo> transferInfos)
        {
            // Arrange
            var transferInfoFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var transfersFileDBItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var transferInfoItems = CreateTransferInfoItems(3);

            foreach (var transferInfoItem in transferInfoItems)
            {
                transferInfoFolderDBItem.Children.Add(transferInfoItem);
            }

            var importFileField = new DbField(Constants.Fields.TransferInfoFolder.ImportFile)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{transfersFileDBItem.ID.ToString()}\" />"
            };

            var languageMappingField = new DbField(Constants.Fields.TransferInfoFolder.LanguageMapping)
            {
                Type = "NameValueList",
                Value = $"de-DE=de&de-CH=de&fr-FR=fr&fr-CH=fr&en=en"
            };

            var hits = new List<SearchHit<BaseTransferInfoSearchResultItem>>();
            foreach (var transferInfo in transferInfos)
            {
                transferInfo.TransfersMinutes = "text";

                hits.Add(new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem
                {
                    ProductId = transferInfo.ProductId,
                    Language = "en"
                }));
            }

            transferInfoFolderDBItem.Fields.Add(importFileField);
            transferInfoFolderDBItem.Fields.Add(languageMappingField);

            var transferInfoTemplate = new DbTemplate("TransferInfoTemplate", Constants.TemplateIds.TransferInfo);

            Db.Add(transferInfoTemplate);

            Db.Add(transferInfoFolderDBItem);
            Db.Add(transfersFileDBItem);

            var mediaItem = new MediaItem(Db.GetItem(transfersFileDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().Returns(mediaStream);
            }

            csvUtilsService.ReadFromCsv<TransferInfo>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).ReturnsForAnyArgs(transferInfos);

            transfersInfoSearchService.GetTransfersInfoByProductIds(Arg.Any<string[]>(), Arg.Any<int>())
                .Returns(hits.Select(t => t.Document).ToList());

            // Act
            var actual = runTransfersImportCommand.ProcessItems(Db.GetItem(transferInfoFolderDBItem.ID));

            // Assert
            actual.Count().Should().Be(0);
        }

        private static DbTemplate CreateTransferInfoTemplate()
        {
            var transferInfoTemplate = new DbTemplate("TransferInfoTemplate", Constants.TemplateIds.TransferInfo);
            var airPortIdField = new DbField(Constants.Fields.TransferInfoItem.AirportId)
            {
                Type = "SingleLineField"
            };
            var resortIdField = new DbField(Constants.Fields.TransferInfoItem.ResortId)
            {
                Type = "SingleLineField"
            };
            var productIdField = new DbField(Constants.Fields.TransferInfoItem.ProductId)
            {
                Type = "SingleLineField"
            };
            var resortNameField = new DbField(Constants.Fields.TransferInfoItem.ResortName)
            {
                Type = "SingleLineField"
            };
            var durationField = new DbField(Constants.Fields.TransferInfoItem.Duration)
            {
                Type = "SingleLineField"
            };
            var arrivalInstrField = new DbField(Constants.Fields.TransferInfoItem.ArrivalInstr)
            {
                Type = "SingleLineField"
            };
            var depInstrField = new DbField(Constants.Fields.TransferInfoItem.DepInstr)
            {
                Type = "SingleLineField"
            };
            var typeField = new DbField(Constants.Fields.TransferInfoItem.Type)
            {
                Type = "SingleLineField"
            };
            transferInfoTemplate.Add(airPortIdField);
            transferInfoTemplate.Add(resortIdField);
            transferInfoTemplate.Add(productIdField);
            transferInfoTemplate.Add(resortNameField);
            transferInfoTemplate.Add(durationField);
            transferInfoTemplate.Add(arrivalInstrField);
            transferInfoTemplate.Add(depInstrField);
            transferInfoTemplate.Add(typeField);
            return transferInfoTemplate;
        }

        private List<DbItem> CreateTransferInfoItems(int numberOfItems)
        {
            var items = new List<DbItem>();

            for (int i = 0; i < numberOfItems; i++)
            {
                var transferInfoItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

                var airportIdField = new DbField(Constants.Fields.TransferInfoItem.AirportId);
                var resortIdField = new DbField(Constants.Fields.TransferInfoItem.ResortId);
                var resortNameField = new DbField(Constants.Fields.TransferInfoItem.ResortName);
                var durationField = new DbField(Constants.Fields.TransferInfoItem.Duration);
                var arrivalInstrFromField = new DbField(Constants.Fields.TransferInfoItem.ArrivalInstr);
                var depInstrField = new DbField(Constants.Fields.TransferInfoItem.DepInstr);
                var typeField = new DbField(Constants.Fields.TransferInfoItem.Type);
                var productIdField = new DbField(Constants.Fields.TransferInfoItem.ProductId);

                transferInfoItem.Fields.Add(airportIdField);
                transferInfoItem.Fields.Add(resortIdField);
                transferInfoItem.Fields.Add(resortNameField);
                transferInfoItem.Fields.Add(durationField);
                transferInfoItem.Fields.Add(arrivalInstrFromField);
                transferInfoItem.Fields.Add(depInstrField);
                transferInfoItem.Fields.Add(typeField);
                transferInfoItem.Fields.Add(productIdField);

                items.Add(transferInfoItem);
            }

            return items;
        }
    }
}
